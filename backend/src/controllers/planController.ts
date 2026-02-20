import type { Request, Response } from 'express';
import pool from '../config/database';

export const getPlans = async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const result = await pool.query('SELECT * FROM plans WHERE tenant_id = $1 ORDER BY price ASC', [user.tenant_id]);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createPlan = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name, price, durationDays, description } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO plans (tenant_id, name, price, duration_days, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.tenant_id, name, price, durationDays, description]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
