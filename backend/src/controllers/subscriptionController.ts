import type { Request, Response } from 'express';
import pool from '../config/database';

export const getSubscriptions = async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const result = await pool.query(
      `SELECT s.*, u.full_name as user_name, u.email as user_email, p.name as plan_name, p.price as plan_price
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       JOIN plans p ON s.plan_id = p.id
       WHERE s.tenant_id = $1
       ORDER BY s.created_at DESC`,
      [user.tenant_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createSubscription = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { userId, planId, startDate, autoRenew = false } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const planResult = await client.query('SELECT duration_days FROM plans WHERE id = $1 AND tenant_id = $2', [planId, user.tenant_id]);
    if (planResult.rows.length === 0) {
      throw new Error('Plan not found');
    }
    const durationDays = planResult.rows[0].duration_days;

    const start = new Date(startDate);
    const expiry = new Date(start);
    expiry.setDate(expiry.getDate() + durationDays);

    const result = await client.query(
      'INSERT INTO subscriptions (tenant_id, user_id, plan_id, start_date, expiry_date, auto_renew) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user.tenant_id, userId, planId, startDate, expiry.toISOString().split('T')[0], autoRenew]
    );

    await client.query('COMMIT');

    await pool.query(
      'INSERT INTO audit_logs (tenant_id, user_id, action, target, payload) VALUES ($1, $2, $3, $4, $5)',
      [user.tenant_id, user.id, 'CREATE_SUBSCRIPTION', result.rows[0].id, JSON.stringify({ userId, planId })]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

export const getExpiringSubscriptions = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const days = parseInt(req.query.days as string) || 5;

  try {
    const result = await pool.query(
      `SELECT s.*, u.full_name as user_name, u.email as user_email, u.phone as user_phone, p.name as plan_name
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       JOIN plans p ON s.plan_id = p.id
       WHERE s.tenant_id = $1
       AND s.status = 'active'
       AND s.expiry_date <= CURRENT_DATE + INTERVAL '${days} days'
       AND s.expiry_date >= CURRENT_DATE
       ORDER BY s.expiry_date ASC`,
      [user.tenant_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
