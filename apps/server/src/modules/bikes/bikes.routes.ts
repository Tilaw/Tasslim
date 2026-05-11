import { Router } from 'express';
import { BikeController } from './bikes.controller.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { bikeSchema } from './bikes.validation.js';

const router = Router();

router.use(authMiddleware);

router.get('/', BikeController.getAll);
router.get('/:id', BikeController.getById);

// Staff can add and update, but only admin can delete
router.post('/', validate(bikeSchema), BikeController.create);
router.patch('/:id', validate(bikeSchema), BikeController.update);

router.delete('/:id', requireRole('super_admin', 'store_manager'), BikeController.delete);

export { router as bikeRoutes };
