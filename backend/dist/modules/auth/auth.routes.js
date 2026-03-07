"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_controller_js_1 = require("./auth.controller.js");
const validation_middleware_js_1 = require("../../middleware/validation.middleware.js");
const auth_validation_js_1 = require("./auth.validation.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Public auth endpoints
router.post('/login', (0, validation_middleware_js_1.validate)(auth_validation_js_1.loginSchema), auth_controller_js_1.AuthController.login);
router.post('/refresh', (0, validation_middleware_js_1.validate)(auth_validation_js_1.refreshSchema), auth_controller_js_1.AuthController.refresh);
// User management endpoints – restricted to admin-level roles
router.post('/register', auth_middleware_js_1.authMiddleware, (0, auth_middleware_js_1.requireRole)('super_admin', 'admin'), (0, validation_middleware_js_1.validate)(auth_validation_js_1.registerSchema), auth_controller_js_1.AuthController.register);
router.get('/', auth_middleware_js_1.authMiddleware, (0, auth_middleware_js_1.requireRole)('super_admin', 'admin'), auth_controller_js_1.AuthController.getAll);
router.delete('/:id', auth_middleware_js_1.authMiddleware, (0, auth_middleware_js_1.requireRole)('super_admin', 'admin'), auth_controller_js_1.AuthController.delete);
exports.authRoutes = router;
