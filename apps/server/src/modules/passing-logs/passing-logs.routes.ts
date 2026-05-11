import { Router } from 'express';
import { PassingLogsController } from './passing-logs.controller.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/dubai-entries', PassingLogsController.listDubai);
router.post(
    '/dubai-entries',
    requireRole('super_admin', 'admin', 'store_manager', 'inventory_manager', 'staff'),
    PassingLogsController.createDubai
);

router.get('/rider-movements', PassingLogsController.listRiderMovements);
router.post(
    '/rider-movements',
    requireRole('super_admin', 'admin', 'store_manager', 'inventory_manager', 'staff'),
    PassingLogsController.createRiderMovement
);

export const passingLogsRoutes = router;
