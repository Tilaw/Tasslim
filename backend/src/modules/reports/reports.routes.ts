import { Router } from 'express';
import { ReportsController } from './reports.controller.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

router.get(
    '/dashboard-stats',
    authMiddleware,
    requireRole('super_admin', 'admin', 'store_manager', 'inventory_manager'),
    ReportsController.getDashboardStats
);

export const reportRoutes = router;
