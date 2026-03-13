"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRoutes = void 0;
const express_1 = require("express");
const reports_controller_js_1 = require("./reports.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
router.get('/dashboard-stats', auth_middleware_js_1.authMiddleware, (0, auth_middleware_js_1.requireRole)('super_admin', 'admin', 'store_manager', 'inventory_manager'), reports_controller_js_1.ReportsController.getDashboardStats);
// Mechanic overtime / active span for a given day.
router.get('/mechanic-overtime', auth_middleware_js_1.authMiddleware, 
// Allow both admin and staff (plus managers) to view overtime
(0, auth_middleware_js_1.requireRole)('super_admin', 'admin', 'store_manager', 'inventory_manager', 'staff'), reports_controller_js_1.ReportsController.getMechanicOvertime);
exports.reportRoutes = router;
