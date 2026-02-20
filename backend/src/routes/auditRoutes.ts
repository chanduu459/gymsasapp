import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController';
import { authenticateToken, requireRole, requireTenant } from '../middleware/auth';

const router = Router();

router.get('/audit-logs', authenticateToken, requireTenant, requireRole('owner'), getAuditLogs);

export default router;
