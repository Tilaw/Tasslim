"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bikeRoutes = void 0;
const express_1 = require("express");
const bikes_controller_js_1 = require("./bikes.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const validation_middleware_js_1 = require("../../middleware/validation.middleware.js");
const bikes_validation_js_1 = require("./bikes.validation.js");
const router = (0, express_1.Router)();
exports.bikeRoutes = router;
router.use(auth_middleware_js_1.authMiddleware);
router.get('/', bikes_controller_js_1.BikeController.getAll);
router.get('/:id', bikes_controller_js_1.BikeController.getById);
// Staff can add and update, but only admin can delete
router.post('/', (0, validation_middleware_js_1.validate)(bikes_validation_js_1.bikeSchema), bikes_controller_js_1.BikeController.create);
router.patch('/:id', (0, validation_middleware_js_1.validate)(bikes_validation_js_1.bikeSchema), bikes_controller_js_1.BikeController.update);
router.delete('/:id', (0, auth_middleware_js_1.requireRole)('super_admin', 'store_manager'), bikes_controller_js_1.BikeController.delete);
