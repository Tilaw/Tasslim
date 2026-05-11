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

// Mechanic overtime / active span for a given day.
router.get(
    '/mechanic-overtime',
    authMiddleware,
    // Allow both admin and staff (plus managers) to view overtime
    requireRole('super_admin', 'admin', 'store_manager', 'inventory_manager', 'staff'),
    ReportsController.getMechanicOvertime
);

export const reportRoutes = router;
