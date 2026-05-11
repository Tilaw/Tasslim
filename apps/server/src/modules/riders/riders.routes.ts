import { Router } from 'express';
import { RiderController } from './riders.controller.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', RiderController.getAll);
router.get('/:id', RiderController.getById);
router.post('/', RiderController.create);
router.patch('/:id', RiderController.update);
router.delete('/imported/all', RiderController.deleteAllImported);
router.delete('/:id', RiderController.delete);

export const riderRoutes = router;
