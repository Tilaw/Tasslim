import { Router } from 'express';
import { TransactionController } from './transactions.controller.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { createTransactionSchema } from './transactions.validation.js';

const router = Router();

router.get('/', authMiddleware, TransactionController.getAll);
router.post('/',
    authMiddleware,
    requireRole('super_admin', 'store_manager', 'inventory_manager'),
    validate(createTransactionSchema),
    TransactionController.create
);

export const transactionRoutes = router;
