"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationRoutes = void 0;
const express_1 = require("express");
const migration_controller_js_1 = require("./migration.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
exports.migrationRoutes = router;
router.post('/import', auth_middleware_js_1.authMiddleware, (0, auth_middleware_js_1.requireRole)('super_admin', 'admin'), migration_controller_js_1.MigrationController.importData);
