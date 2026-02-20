import { Router } from 'express';
import { createPlan, getPlans } from '../controllers/planController';
import { authenticateToken, requireRole, requireTenant } from '../middleware/auth';

const router = Router();

router.get('/plans', authenticateToken, requireTenant, getPlans);
router.post('/plans', authenticateToken, requireTenant, requireRole('owner'), createPlan);

export default router;
