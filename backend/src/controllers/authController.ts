import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { JWT_SECRET } from '../middleware/auth';
import { searchFaceInCollection } from '../config/rekognition';

export const registerGym = async (req: Request, res: Response) => {
  const { gymName, timezone = 'UTC' } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const gymResult = await client.query(
      'INSERT INTO gyms (name, timezone) VALUES ($1, $2) RETURNING *',
      [gymName, timezone]
    );
    const gym = gymResult.rows[0];

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
      data: { gym },
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT id, tenant_id, full_name, email, phone, role, password_hash, is_active FROM users WHERE email = $1',
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
    // Convert base64 to Buffer
    const buffer = Buffer.from(imageBase64, 'base64');

    // Search for face in Rekognition collection
    const faceMatch = await searchFaceInCollection(buffer);

    if (!faceMatch || !faceMatch.userId) {
      return res.status(404).json({ success: false, error: 'Face not recognized' });
    }

    // Get member info by userId (which is stored as ExternalImageId in Rekognition)
    const result = await pool.query(
      'SELECT id, full_name, email, phone, role, face_image_url FROM users WHERE id = $1 AND is_active = true',
      [faceMatch.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Member not found or inactive' });
    }

    const member = result.rows[0];

    res.json({
      success: true,
      data: {
        member,
        confidence: faceMatch.confidence,
        recognized: true,
      },
    });
  } catch (error: any) {
    console.error('Face identification error:', error);
    res.status(500).json({ success: false, error: 'Face identification failed' });
  }
};

