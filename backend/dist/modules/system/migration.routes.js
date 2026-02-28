import { Router } from 'express';
import { MigrationController } from './migration.controller.js';
const router = Router();
router.post('/import', MigrationController.importData);
export { router as migrationRoutes };
