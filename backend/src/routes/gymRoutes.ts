import { Router } from 'express';
import multer from 'multer';
import { createMember, getMembers, updateMember, syncMemberFacesToRekognition } from '../controllers/gymController';
import { authenticateToken, requireRole, requireTenant } from '../middleware/auth';

const router = Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 20 * 1024 * 1024 },
});

router.get('/members', authenticateToken, requireTenant, getMembers);
router.post('/members', authenticateToken, requireTenant, requireRole('owner', 'staff'), upload.single('faceImage'), createMember);
router.put('/members/:id', authenticateToken, requireTenant, requireRole('owner', 'staff'), upload.single('faceImage'), updateMember);
router.post('/members/sync-faces', authenticateToken, requireTenant, requireRole('owner'), syncMemberFacesToRekognition);

export default router;
