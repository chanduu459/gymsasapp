import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { buildFaceEmbeddingFromImage } from '../utils/faceEmbedding';

export const getMembers = async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const result = await pool.query(
      'SELECT id, tenant_id, full_name, email, phone, role, is_active, face_image_url, face_embedding, created_at FROM users WHERE tenant_id = $1 AND role = $2 ORDER BY created_at DESC',
      [user.tenant_id, 'member']
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createMember = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { fullName, email, phone, password } = req.body;
  const faceImage = req.file;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const trimmedFullName = typeof fullName === 'string' ? fullName.trim() : '';

  if (!trimmedFullName || !normalizedEmail) {
    return res.status(400).json({ success: false, error: 'fullName and email are required' });
  }

  try {
    const passwordValue = typeof password === 'string' && password.trim().length > 0 ? password.trim() : 'welcome123';
    const passwordHash = await bcrypt.hash(passwordValue, 10);
    let faceEmbedding: number[] | null = null;

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Email is already registered' });
    }

    if (faceImage) {
      if (!faceImage.mimetype.startsWith('image/')) {
        return res.status(400).json({ success: false, error: 'Only image uploads are allowed for member face image' });
      }

      faceEmbedding = await buildFaceEmbeddingFromImage(faceImage.buffer);
    }

    const result = await pool.query(
      'INSERT INTO users (tenant_id, full_name, email, phone, role, password_hash, face_image_url, face_embedding) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, tenant_id, full_name, email, phone, role, is_active, face_image_url, face_embedding, created_at',
      [user.tenant_id, trimmedFullName, normalizedEmail, phone || null, 'member', passwordHash, null, faceEmbedding]
    );

    await pool.query(
      'INSERT INTO audit_logs (tenant_id, user_id, action, target, payload) VALUES ($1, $2, $3, $4, $5)',
      [user.tenant_id, user.id, 'CREATE_MEMBER', result.rows[0].id, JSON.stringify({ email: normalizedEmail })]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateMember = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { fullName, email, phone, isActive } = req.body;
  const faceImage = req.file;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const trimmedFullName = typeof fullName === 'string' ? fullName.trim() : '';

  try {
    let faceEmbedding: number[] | null = null;

    if (faceImage) {
      if (!faceImage.mimetype.startsWith('image/')) {
        return res.status(400).json({ success: false, error: 'Only image uploads are allowed for member face image' });
      }

      faceEmbedding = await buildFaceEmbeddingFromImage(faceImage.buffer);
    }

    const updateFields: any[] = [trimmedFullName, normalizedEmail, phone || null, isActive, id, user.tenant_id];
    let query = 'UPDATE users SET full_name = $1, email = $2, phone = $3, is_active = $4';

    if (faceImage) {
      query += ', face_image_url = $7, face_embedding = $8';
      updateFields.push(null);
      updateFields.push(faceEmbedding);
    }

    query += ' WHERE id = $5 AND tenant_id = $6 RETURNING id, tenant_id, full_name, email, phone, role, is_active, face_image_url, face_embedding, created_at';

    const result = await pool.query(query, updateFields);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    await pool.query(
      'INSERT INTO audit_logs (tenant_id, user_id, action, target, payload) VALUES ($1, $2, $3, $4, $5)',
      [user.tenant_id, user.id, 'UPDATE_MEMBER', id, JSON.stringify({ email: normalizedEmail })]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const syncMemberFacesToRekognition = async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    // Face embeddings are now generated automatically during member registration.
    // This endpoint is no longer needed but kept for backward compatibility.
    const result = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE tenant_id = $1 AND role = $2 AND face_embedding IS NOT NULL AND is_active = true',
      [user.tenant_id, 'member']
    );

    const totalWithEmbeddings = parseInt(result.rows[0]?.total || '0', 10);

    res.json({
      success: true,
      data: {
        message: `Face embeddings are generated automatically at registration. ${totalWithEmbeddings} members currently have face embeddings.`,
        total: totalWithEmbeddings,
        info: 'No sync needed - embeddings are created when members are added/updated with face images.',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
