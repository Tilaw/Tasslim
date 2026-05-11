import { Router } from 'express';
import { TransactionController } from './transactions.controller.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { createTransactionSchema, createBatchTransactionsSchema } from './transactions.validation.js';

const router = Router();

router.get('/', authMiddleware, TransactionController.getAll);
router.post(
    '/',
    authMiddleware,
    requireRole('super_admin', 'store_manager', 'inventory_manager', 'admin', 'staff'),
    validate(createTransactionSchema),
    TransactionController.create
);
router.post(
    '/batch',
    authMiddleware,
    requireRole('super_admin', 'store_manager', 'inventory_manager', 'admin', 'staff'),
    validate(createBatchTransactionsSchema),
    TransactionController.createBatch
);

// Revert an issuance/transaction group by its reference ID (e.g. Issue ID shown in UI)
router.delete(
    '/group/:referenceId',
    authMiddleware,
    // Admins and staff (plus managers) can revert any issuance group
    requireRole('super_admin', 'store_manager', 'inventory_manager', 'admin', 'staff'),
    TransactionController.revertGroup
);

export const transactionRoutes = router;
