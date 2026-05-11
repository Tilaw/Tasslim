import { Router } from 'express';
import { OilChangeController } from './oil-changes.controller.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', OilChangeController.getAll);
router.post(
    '/',
    requireRole('super_admin', 'admin', 'store_manager', 'inventory_manager', 'staff'),
    OilChangeController.create
);

export const oilChangeRoutes = router;

