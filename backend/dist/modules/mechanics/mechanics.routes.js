"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mechanicRoutes = void 0;
const express_1 = require("express");
const mechanics_controller_js_1 = require("./mechanics.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const validation_middleware_js_1 = require("../../middleware/validation.middleware.js");
const mechanics_validation_js_1 = require("./mechanics.validation.js");
const router = (0, express_1.Router)();
exports.mechanicRoutes = router;
router.use(auth_middleware_js_1.authMiddleware);
router.get('/', mechanics_controller_js_1.MechanicController.getAll);
router.get('/:id', mechanics_controller_js_1.MechanicController.getById);
// Staff can add and update, but only admin can delete
router.post('/', (0, validation_middleware_js_1.validate)(mechanics_validation_js_1.mechanicSchema), mechanics_controller_js_1.MechanicController.create);
router.patch('/:id', (0, validation_middleware_js_1.validate)(mechanics_validation_js_1.mechanicSchema), mechanics_controller_js_1.MechanicController.update);
router.delete('/:id', (0, auth_middleware_js_1.requireRole)('super_admin', 'store_manager'), mechanics_controller_js_1.MechanicController.delete);
