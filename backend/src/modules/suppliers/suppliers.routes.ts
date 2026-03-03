import { Router } from 'express';
import { SupplierController } from './suppliers.controller.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { createSupplierSchema, updateSupplierSchema } from './suppliers.validation.js';

const router = Router();

router.get('/', authMiddleware, SupplierController.getAll);
router.post(
    '/',
    authMiddleware,
    requireRole('super_admin', 'admin', 'store_manager', 'inventory_manager', 'staff'),
    validate(createSupplierSchema),
    SupplierController.create
);
router.patch(
    '/:id',
    authMiddleware,
    requireRole('super_admin', 'admin', 'store_manager', 'inventory_manager', 'staff'),
    validate(updateSupplierSchema),
    SupplierController.update
);
router.delete(
    '/:id',
    authMiddleware,
    requireRole('super_admin', 'admin', 'store_manager', 'inventory_manager', 'staff'),
    SupplierController.delete
);

export const supplierRoutes = router;
