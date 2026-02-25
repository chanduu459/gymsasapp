import type { Request, Response } from 'express';
import pool from '../config/database';
import { buildFaceEmbeddingFromImage } from '../utils/faceEmbedding';
import { findBestFaceEmbeddingMatch } from '../services/faceMatchService';

export const getAttendance = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const requestedDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const status = (req.query.status as string) || 'present';

  try {
    const params: Array<string> = [user.tenant_id, requestedDate];
    let statusClause = '';

    if (status !== 'all') {
      params.push(status);
      statusClause = 'AND a.status = $3';
    }

    const result = await pool.query(
      `SELECT a.*, u.full_name, u.email, u.phone, u.role
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.tenant_id = $1
       AND a.attendance_date = $2
       ${statusClause}
       ORDER BY u.full_name ASC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const faceCheckin = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { imageData } = req.body;

  try {
    if (!imageData) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }

    const imageBuffer = Buffer.from(imageData, 'base64');
    const inputEmbedding = await buildFaceEmbeddingFromImage(imageBuffer);

    const candidatesResult = await pool.query(
      `SELECT id, full_name, email, tenant_id, is_active, face_embedding
       FROM users
       WHERE tenant_id = $1 AND role = 'member' AND is_active = true AND face_embedding IS NOT NULL`,
      [user.tenant_id]
    );

    const matchResult = findBestFaceEmbeddingMatch(inputEmbedding, candidatesResult.rows);

    if (!matchResult) {
      return res.status(404).json({
        success: false,
        error: 'No matching member face found. Please ensure your face is clearly visible.',
      });
    }

    const memberId = matchResult.candidate.id;
    const member = matchResult.candidate;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Check if member already has attendance for today
    const existingAttendance = await pool.query(
      'SELECT id FROM attendance WHERE user_id = $1 AND attendance_date = $2',
      [memberId, today]
    );

    let attendanceRecord;

    if (existingAttendance.rows.length > 0) {
      // Update check_out time
      const result = await pool.query(
        'UPDATE attendance SET check_out = $1 WHERE user_id = $2 AND attendance_date = $3 RETURNING *',
        [now, memberId, today]
      );
      attendanceRecord = result.rows[0];
    } else {
      // Create new attendance record
      const result = await pool.query(
        'INSERT INTO attendance (tenant_id, user_id, attendance_date, check_in, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [user.tenant_id, memberId, today, now, 'present']
      );
      attendanceRecord = result.rows[0];
    }

    res.json({
      success: true,
      data: {
        member: {
          id: member.id,
          full_name: member.full_name,
          email: member.email,
        },
        attendance: attendanceRecord,
        confidence: matchResult.confidence,
        isCheckout: existingAttendance.rows.length > 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
