import type { Request, Response } from 'express';
import pool from '../config/database';

export const getNotifications = async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const result = await pool.query(
      `SELECT n.*, u.full_name as user_name
       FROM notifications n
       JOIN users u ON n.user_id = u.id
       WHERE n.tenant_id = $1
       ORDER BY n.created_at DESC
       LIMIT 100`,
      [user.tenant_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
