"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRoutes = void 0;
const express_1 = require("express");
const products_controller_js_1 = require("./products.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const validation_middleware_js_1 = require("../../middleware/validation.middleware.js");
const products_validation_js_1 = require("./products.validation.js");
const router = (0, express_1.Router)();
// Public/Shared routes (still require login)
router.get('/', auth_middleware_js_1.authMiddleware, products_controller_js_1.ProductController.getAll);
router.get('/:id', auth_middleware_js_1.authMiddleware, products_controller_js_1.ProductController.getById);
// Admin/Manager only
router.post('/', auth_middleware_js_1.authMiddleware, (0, auth_middleware_js_1.requireRole)('super_admin', 'store_manager', 'inventory_manager'), (0, validation_middleware_js_1.validate)(products_validation_js_1.createProductSchema), products_controller_js_1.ProductController.create);
router.patch('/:id', auth_middleware_js_1.authMiddleware, (0, auth_middleware_js_1.requireRole)('super_admin', 'store_manager', 'inventory_manager'), (0, validation_middleware_js_1.validate)(products_validation_js_1.updateProductSchema), products_controller_js_1.ProductController.update);
router.delete('/:id', auth_middleware_js_1.authMiddleware, (0, auth_middleware_js_1.requireRole)('super_admin', 'store_manager'), products_controller_js_1.ProductController.delete);
exports.productRoutes = router;
