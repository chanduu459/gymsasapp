import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { uploadMemberFaceImage } from '../config/s3';
import { buildFaceEmbeddingFromImage } from '../utils/faceEmbedding';
import { indexMemberFace, indexMemberFaceFromUrl } from '../config/rekognition';

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
    let faceImageUrl: string | null = null;
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

      const uploadResult = await uploadMemberFaceImage(user.tenant_id, user.id, faceImage);
      faceImageUrl = uploadResult.imageUrl;
      faceEmbedding = buildFaceEmbeddingFromImage(faceImage.buffer);
    }

    const result = await pool.query(
      'INSERT INTO users (tenant_id, full_name, email, phone, role, password_hash, face_image_url, face_embedding) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, tenant_id, full_name, email, phone, role, is_active, face_image_url, face_embedding, created_at',
      [user.tenant_id, trimmedFullName, normalizedEmail, phone || null, 'member', passwordHash, faceImageUrl, faceEmbedding]
    );

    // Index face in Rekognition collection for face-based login if image provided
    if (faceImage) {
      try {
        await indexMemberFace(result.rows[0].id, faceImage.buffer);
      } catch (indexError: any) {
        console.warn(`Failed to index face for Rekognition: ${indexError.message}`);
        // Don't fail member creation if Rekognition indexing fails; face login just won't work
      }
    }

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

  try {
    const result = await pool.query(
      'UPDATE users SET full_name = $1, email = $2, phone = $3, is_active = $4 WHERE id = $5 AND tenant_id = $6 RETURNING id, tenant_id, full_name, email, phone, role, is_active, face_image_url, face_embedding, created_at',
      [fullName, email, phone, isActive, id, user.tenant_id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const syncMemberFacesToRekognition = async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    // Get all members with face images that belong to this gym
    const result = await pool.query(
      'SELECT id, full_name, face_image_url FROM users WHERE tenant_id = $1 AND role = $2 AND face_image_url IS NOT NULL AND is_active = true',
      [user.tenant_id, 'member']
    );

    const members = result.rows;
    const syncResults = {
      total: members.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Index each face in Rekognition
    for (const member of members) {
      try {
        await indexMemberFaceFromUrl(member.id, member.face_image_url);
        syncResults.success++;
      } catch (indexError: any) {
        syncResults.failed++;
        syncResults.errors.push(`${member.full_name}: ${indexError.message}`);
      }
    }

    res.json({
      success: true,
      data: {
        message: `Face sync completed. ${syncResults.success}/${syncResults.total} faces indexed successfully.`,
        ...syncResults,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
