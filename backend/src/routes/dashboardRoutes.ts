import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticateToken, requireTenant } from '../middleware/auth';

const router = Router();

router.get('/dashboard/stats', authenticateToken, requireTenant, getDashboardStats);

export default router;
