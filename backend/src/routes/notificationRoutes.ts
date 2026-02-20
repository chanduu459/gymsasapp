import { Router } from 'express';
import { getNotifications } from '../controllers/notificationController';
import { authenticateToken, requireTenant } from '../middleware/auth';

const router = Router();

router.get('/notifications', authenticateToken, requireTenant, getNotifications);

export default router;
