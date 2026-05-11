import { Router } from 'express';
import { MechanicController } from './mechanics.controller.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { mechanicSchema } from './mechanics.validation.js';

const router = Router();

router.use(authMiddleware);

router.get('/', MechanicController.getAll);
router.get('/:id', MechanicController.getById);

// Staff can add and update, but only admin can delete
router.post('/', validate(mechanicSchema), MechanicController.create);
router.patch('/:id', validate(mechanicSchema), MechanicController.update);

router.delete('/:id', requireRole('super_admin', 'store_manager'), MechanicController.delete);

export { router as mechanicRoutes };
