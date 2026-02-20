import { Router } from 'express';
import {
  createSubscription,
  getExpiringSubscriptions,
  getSubscriptions,
} from '../controllers/subscriptionController';
import { authenticateToken, requireRole, requireTenant } from '../middleware/auth';
import { checkExpiringSubscriptions } from '../jobs/expiryJob';

const router = Router();

router.get('/subscriptions', authenticateToken, requireTenant, getSubscriptions);
router.post('/subscriptions', authenticateToken, requireTenant, requireRole('owner', 'staff'), createSubscription);
router.get('/subscriptions/expiring', authenticateToken, requireTenant, getExpiringSubscriptions);

router.post('/cron/check-expiring', authenticateToken, requireRole('owner'), async (_req, res) => {
  await checkExpiringSubscriptions();
  res.json({ success: true, message: 'Expiry check completed' });
});

export default router;
