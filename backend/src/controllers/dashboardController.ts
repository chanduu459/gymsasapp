import type { Request, Response } from 'express';
import pool from '../config/database';

export const getDashboardStats = async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    const activeMembersResult = await pool.query(
      'SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role = $2 AND is_active = true',
      [user.tenant_id, 'member']
    );

    const expiringResult = await pool.query(
      `SELECT COUNT(*) FROM subscriptions
       WHERE tenant_id = $1 AND status = 'active'
       AND expiry_date <= CURRENT_DATE + INTERVAL '7 days'
       AND expiry_date >= CURRENT_DATE`,
      [user.tenant_id]
    );

    const expiredResult = await pool.query(
      `SELECT COUNT(DISTINCT user_id) FROM subscriptions
       WHERE tenant_id = $1 AND status = 'expired'`,
      [user.tenant_id]
    );

    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(p.price), 0) as revenue
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.tenant_id = $1
       AND s.created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
      [user.tenant_id]
    );

    const renewalResult = await pool.query(
      `SELECT
        CASE
          WHEN COUNT(*) FILTER (WHERE status = 'expired') = 0 THEN 100
          ELSE (COUNT(*) FILTER (WHERE status = 'active') * 100.0 / NULLIF(COUNT(*), 0))
        END as renewal_rate
       FROM subscriptions
       WHERE tenant_id = $1`,
      [user.tenant_id]
    );

    res.json({
      success: true,
      data: {
        activeMembers: parseInt(activeMembersResult.rows[0].count),
        expiringIn7Days: parseInt(expiringResult.rows[0].count),
        expiredMembers: parseInt(expiredResult.rows[0].count),
        monthlyRevenue: parseFloat(revenueResult.rows[0].revenue),
        renewalRate: parseFloat(renewalResult.rows[0].renewal_rate) || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
