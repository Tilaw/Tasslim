import { Router } from 'express';
import { ProductController } from './products.controller.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { createProductSchema, updateProductSchema } from './products.validation.js';
const router = Router();
// Public/Shared routes (still require login)
router.get('/', authMiddleware, ProductController.getAll);
router.get('/:id', authMiddleware, ProductController.getById);
// Admin/Manager only
router.post('/', authMiddleware, requireRole('super_admin', 'store_manager', 'inventory_manager'), validate(createProductSchema), ProductController.create);
router.patch('/:id', authMiddleware, requireRole('super_admin', 'store_manager', 'inventory_manager'), validate(updateProductSchema), ProductController.update);
router.delete('/:id', authMiddleware, requireRole('super_admin', 'store_manager'), ProductController.delete);
export const productRoutes = router;
