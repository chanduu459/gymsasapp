import type { Request, Response } from 'express';
import pool from '../config/database';

export const getSubscriptions = async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const result = await pool.query(
      `SELECT latest.*
       FROM (
         SELECT DISTINCT ON (s.user_id)
           s.*, u.full_name as user_name, u.email as user_email, p.name as plan_name, p.price as plan_price
         FROM subscriptions s
         JOIN users u ON s.user_id = u.id
         JOIN plans p ON s.plan_id = p.id
         WHERE s.tenant_id = $1
         ORDER BY
           s.user_id,
           CASE
             WHEN s.status = 'active' THEN 0
             WHEN s.status = 'expired' THEN 1
             ELSE 2
           END,
           s.expiry_date DESC,
           s.created_at DESC
       ) latest
       ORDER BY latest.created_at DESC`,
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

    const memberResult = await client.query(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND role = $3 LIMIT 1',
      [userId, user.tenant_id, 'member']
    );
    if (memberResult.rows.length === 0) {
      throw new Error('Member not found');
    }

    const planResult = await client.query('SELECT duration_days FROM plans WHERE id = $1 AND tenant_id = $2', [planId, user.tenant_id]);
    if (planResult.rows.length === 0) {
      throw new Error('Plan not found');
    }
    const durationDays = planResult.rows[0].duration_days;

    const start = new Date(startDate);
    const expiry = new Date(start);
    expiry.setDate(expiry.getDate() + durationDays);

    const existingSubscriptionResult = await client.query(
      `SELECT id
       FROM subscriptions
       WHERE tenant_id = $1 AND user_id = $2 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.tenant_id, userId]
    );

    let result;
    let auditAction = 'CREATE_SUBSCRIPTION';

    if (existingSubscriptionResult.rows.length > 0) {
      const existingSubscriptionId = existingSubscriptionResult.rows[0].id;

      result = await client.query(
        `UPDATE subscriptions
         SET plan_id = $1,
             start_date = $2,
             expiry_date = $3,
             auto_renew = $4,
             status = 'active',
             last_notification_tags = '[]'::jsonb
         WHERE id = $5 AND tenant_id = $6
         RETURNING *`,
        [planId, startDate, expiry.toISOString().split('T')[0], autoRenew, existingSubscriptionId, user.tenant_id]
      );

      auditAction = 'UPDATE_SUBSCRIPTION';
    } else {
      result = await client.query(
        'INSERT INTO subscriptions (tenant_id, user_id, plan_id, start_date, expiry_date, auto_renew) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [user.tenant_id, userId, planId, startDate, expiry.toISOString().split('T')[0], autoRenew]
      );
    }

    await client.query('COMMIT');

    await pool.query(
      'INSERT INTO audit_logs (tenant_id, user_id, action, target, payload) VALUES ($1, $2, $3, $4, $5)',
      [user.tenant_id, user.id, auditAction, result.rows[0].id, JSON.stringify({ userId, planId, startDate })]
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
