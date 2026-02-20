import { Router } from 'express';
import { createMember, getMembers, updateMember } from '../controllers/gymController';
import { authenticateToken, requireRole, requireTenant } from '../middleware/auth';

const router = Router();

router.get('/members', authenticateToken, requireTenant, getMembers);
router.post('/members', authenticateToken, requireTenant, requireRole('owner', 'staff'), createMember);
router.put('/members/:id', authenticateToken, requireTenant, requireRole('owner', 'staff'), updateMember);

export default router;
