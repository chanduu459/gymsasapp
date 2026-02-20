import type { Request, Response } from 'express';
import pool from '../config/database';

export const getAuditLogs = async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const result = await pool.query(
      `SELECT a.*, u.full_name as user_name
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.tenant_id = $1
       ORDER BY a.created_at DESC
       LIMIT 100`,
      [user.tenant_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
