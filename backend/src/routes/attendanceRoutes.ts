import { Router } from 'express';
import { getAttendance } from '../controllers/attendanceController';
import { authenticateToken, requireTenant } from '../middleware/auth';

const router = Router();

router.get('/attendance', authenticateToken, requireTenant, getAttendance);

export default router;
