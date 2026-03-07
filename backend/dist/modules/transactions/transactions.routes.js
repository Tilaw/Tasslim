"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRoutes = void 0;
const express_1 = require("express");
const transactions_controller_js_1 = require("./transactions.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const validation_middleware_js_1 = require("../../middleware/validation.middleware.js");
const transactions_validation_js_1 = require("./transactions.validation.js");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_js_1.authMiddleware, transactions_controller_js_1.TransactionController.getAll);
router.post('/', auth_middleware_js_1.authMiddleware, 
// Allow admins, managers, and staff to create issue/transaction records
(0, auth_middleware_js_1.requireRole)('super_admin', 'store_manager', 'inventory_manager', 'admin', 'staff'), (0, validation_middleware_js_1.validate)(transactions_validation_js_1.createTransactionSchema), transactions_controller_js_1.TransactionController.create);
// Revert an issuance/transaction group by its reference ID (e.g. Issue ID shown in UI)
router.delete('/group/:referenceId', auth_middleware_js_1.authMiddleware, 
// Admins and staff (plus managers) can revert any issuance group
(0, auth_middleware_js_1.requireRole)('super_admin', 'store_manager', 'inventory_manager', 'admin', 'staff'), transactions_controller_js_1.TransactionController.revertGroup);
exports.transactionRoutes = router;
