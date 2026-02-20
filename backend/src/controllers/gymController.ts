import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';

export const getMembers = async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const result = await pool.query(
      'SELECT id, tenant_id, full_name, email, phone, role, is_active, created_at FROM users WHERE tenant_id = $1 AND role = $2 ORDER BY created_at DESC',
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

  try {
    const passwordHash = await bcrypt.hash(password || 'welcome123', 10);
    const result = await pool.query(
      'INSERT INTO users (tenant_id, full_name, email, phone, role, password_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, tenant_id, full_name, email, phone, role, is_active, created_at',
      [user.tenant_id, fullName, email, phone, 'member', passwordHash]
    );

    await pool.query(
      'INSERT INTO audit_logs (tenant_id, user_id, action, target, payload) VALUES ($1, $2, $3, $4, $5)',
      [user.tenant_id, user.id, 'CREATE_MEMBER', result.rows[0].id, JSON.stringify({ email })]
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
      'UPDATE users SET full_name = $1, email = $2, phone = $3, is_active = $4 WHERE id = $5 AND tenant_id = $6 RETURNING id, tenant_id, full_name, email, phone, role, is_active, created_at',
      [fullName, email, phone, isActive, id, user.tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
