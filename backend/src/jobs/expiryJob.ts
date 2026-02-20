import cron from 'node-cron';
import pool from '../config/database';

export async function checkExpiringSubscriptions() {
  console.log('Running daily expiry check...');
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT s.*, u.full_name as user_name, u.email as user_email, u.phone as user_phone,
              p.name as plan_name, g.timezone
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       JOIN plans p ON s.plan_id = p.id
       JOIN gyms g ON s.tenant_id = g.id
       WHERE s.status = 'active'
       AND s.expiry_date = CURRENT_DATE + INTERVAL '5 days'
       AND NOT (s.last_notification_tags @> '["expiry_5d"]')`
    );

    for (const subscription of result.rows) {
      try {
        const ownerResult = await client.query('SELECT * FROM users WHERE tenant_id = $1 AND role = $2 LIMIT 1', [
          subscription.tenant_id,
          'owner',
        ]);
        const owner = ownerResult.rows[0];

        await client.query(
          'INSERT INTO notifications (tenant_id, user_id, subscription_id, channel, template_name, status) VALUES ($1, $2, $3, $4, $5, $6)',
          [subscription.tenant_id, subscription.user_id, subscription.id, 'email', 'expiry_5d_member', 'sent']
        );

        if (owner) {
          await client.query(
            'INSERT INTO notifications (tenant_id, user_id, subscription_id, channel, template_name, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [subscription.tenant_id, owner.id, subscription.id, 'email', 'expiry_5d_owner', 'sent']
          );
        }

        await client.query('UPDATE subscriptions SET last_notification_tags = last_notification_tags || $1::jsonb WHERE id = $2', [
          JSON.stringify(['expiry_5d']),
          subscription.id,
        ]);

        console.log(`Sent expiry notification for subscription ${subscription.id}`);
      } catch (error) {
        console.error(`Failed to process subscription ${subscription.id}:`, error);
      }
    }

    await client.query(
      `UPDATE subscriptions SET status = 'expired'
       WHERE status = 'active' AND expiry_date < CURRENT_DATE`
    );

    console.log('Daily expiry check completed');
  } finally {
    client.release();
  }
}

export function scheduleExpiryJob() {
  cron.schedule('30 0 * * *', checkExpiringSubscriptions);
}
