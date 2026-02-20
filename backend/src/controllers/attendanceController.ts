import type { Request, Response } from 'express';
import pool from '../config/database';

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
