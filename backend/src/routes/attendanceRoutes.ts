import { Router } from 'express';
import { getAttendance, faceCheckin } from '../controllers/attendanceController';
import { authenticateToken, requireTenant } from '../middleware/auth';

const router = Router();

router.get('/attendance', authenticateToken, requireTenant, getAttendance);
router.post('/attendance/face-checkin', authenticateToken, requireTenant, faceCheckin);

export default router;
