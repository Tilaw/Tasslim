import { Router } from 'express';
import { MigrationController } from './migration.controller.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

router.post(
    '/import',
    authMiddleware,
    requireRole('super_admin', 'admin'),
    MigrationController.importData
);

export { router as migrationRoutes };
