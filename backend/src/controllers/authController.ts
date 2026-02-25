import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { JWT_SECRET } from '../middleware/auth';
import { buildFaceEmbeddingFromImage } from '../utils/faceEmbedding';
import {
  findBestFaceEmbeddingCandidate,
  findBestFaceEmbeddingMatch,
  getFaceEmbeddingMatchThreshold,
} from '../services/faceMatchService';

export const registerGym = async (req: Request, res: Response) => {
  const { gymName, ownerName, email, phone, password, timezone = 'UTC' } = req.body;

  const trimmedGymName = typeof gymName === 'string' ? gymName.trim() : '';
  const trimmedOwnerName = typeof ownerName === 'string' ? ownerName.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';
  const passwordValue = typeof password === 'string' ? password.trim() : '';

  if (!trimmedGymName || !trimmedOwnerName || !normalizedEmail || !passwordValue) {
    return res.status(400).json({
      success: false,
      error: 'gymName, ownerName, email and password are required',
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingUserResult = await client.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [normalizedEmail]
    );

    if (existingUserResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, error: 'Email is already registered' });
    }

    const gymResult = await client.query(
      'INSERT INTO gyms (name, timezone) VALUES ($1, $2) RETURNING *',
      [trimmedGymName, timezone]
    );
    const gym = gymResult.rows[0];

    const passwordHash = await bcrypt.hash(passwordValue, 10);

    const ownerResult = await client.query(
      'INSERT INTO users (tenant_id, full_name, email, phone, role, password_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, tenant_id, full_name, email, phone, role, is_active, created_at',
      [gym.id, trimmedOwnerName, normalizedEmail, trimmedPhone || null, 'owner', passwordHash]
    );
    const owner = ownerResult.rows[0];

    await client.query(
      'INSERT INTO plans (tenant_id, name, price, duration_days, description) VALUES ($1, $2, $3, $4, $5)',
      [gym.id, 'Monthly Plan', 50.0, 30, 'Standard monthly membership']
    );
    await client.query(
      'INSERT INTO plans (tenant_id, name, price, duration_days, description) VALUES ($1, $2, $3, $4, $5)',
      [gym.id, 'Quarterly Plan', 135.0, 90, '3-month membership (10% savings)']
    );
    await client.query(
      'INSERT INTO plans (tenant_id, name, price, duration_days, description) VALUES ($1, $2, $3, $4, $5)',
      [gym.id, 'Annual Plan', 480.0, 365, '1-year membership (20% savings)']
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: { gym, owner },
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

export const login = async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'email and password are required',
    });
  }

  try {
    const result = await pool.query(
      'SELECT id, tenant_id, full_name, email, phone, role, password_hash, is_active FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ success: false, error: 'Account is deactivated' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    delete (user as any).password_hash;

    res.json({
      success: true,
      data: { user, token },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const result = await pool.query(
      'SELECT id, tenant_id, full_name, email, phone, role, is_active, created_at FROM users WHERE id = $1',
      [user.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const identifyFace = async (req: Request, res: Response) => {
  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ success: false, error: 'No image provided' });
  }

  try {
    const buffer = Buffer.from(imageBase64, 'base64');
    const inputEmbedding = await buildFaceEmbeddingFromImage(buffer);

    const candidatesResult = await pool.query(
      `SELECT id, full_name, email, phone, role, face_image_url, face_embedding
       FROM users
       WHERE role = 'member' AND is_active = true AND face_embedding IS NOT NULL`
    );

    if (candidatesResult.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          recognized: false,
          confidence: 0,
          member: null,
          subscription: null,
          message: 'No enrolled member face embeddings found',
        },
      });
    }

    const bestCandidate = findBestFaceEmbeddingCandidate(inputEmbedding, candidatesResult.rows);
    const threshold = getFaceEmbeddingMatchThreshold();
    const faceMatch = findBestFaceEmbeddingMatch(inputEmbedding, candidatesResult.rows);

    if (!faceMatch) {
      return res.json({
        success: true,
        data: {
          recognized: false,
          confidence: bestCandidate?.confidence ?? 0,
          member: null,
          subscription: null,
          message: `Face not recognized (best similarity ${((bestCandidate?.similarity ?? 0) * 100).toFixed(1)}%, threshold ${(threshold * 100).toFixed(1)}%). If this member was enrolled before embedding update, run /api/members/sync-faces once.`,
        },
      });
    }

    const member = {
      id: faceMatch.candidate.id,
      full_name: faceMatch.candidate.full_name,
      email: faceMatch.candidate.email,
      phone: faceMatch.candidate.phone,
      role: faceMatch.candidate.role,
      face_image_url: faceMatch.candidate.face_image_url,
    };

    const subscriptionResult = await pool.query(
      `SELECT s.id, s.status, s.start_date, s.expiry_date, s.auto_renew,
              p.name AS plan_name, p.price AS plan_price, p.duration_days,
              GREATEST((s.expiry_date - CURRENT_DATE), 0)::int AS days_remaining
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1
       ORDER BY CASE WHEN s.status = 'active' THEN 0 ELSE 1 END, s.expiry_date DESC
       LIMIT 1`,
      [member.id]
    );

    const subscription = subscriptionResult.rows[0] ?? null;

    res.json({
      success: true,
      data: {
        member,
        subscription,
        confidence: faceMatch.confidence,
        recognized: true,
      },
    });
  } catch (error: any) {
    console.error('Face identification error:', error);
    res.status(500).json({ success: false, error: 'Face identification failed' });
  }
};

