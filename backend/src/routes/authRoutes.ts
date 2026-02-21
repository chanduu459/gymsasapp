import { Router } from 'express';
import { getCurrentUser, login, registerGym, identifyFace } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/gyms/register', registerGym);
router.post('/auth/login', login);
router.post('/auth/identify-face', identifyFace);
router.get('/auth/me', authenticateToken, getCurrentUser);

export default router;
