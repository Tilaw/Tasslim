"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        sku: zod_1.z.string().min(1, 'SKU is required'),
        name: zod_1.z.string().min(1, 'Product name is required'),
        description: zod_1.z.string().optional(),
        // Legacy frontend sends `category` as a name; newer API can send `categoryId`.
        categoryId: zod_1.z.string().uuid('Invalid category ID').optional(),
        category: zod_1.z.string().min(1).optional(),
        brand: zod_1.z.string().optional(),
        model: zod_1.z.string().optional(),
        // Accept both legacy (`unit`, `minStock`, `cost`, `price`) and API (`unitOfMeasure`, `reorderLevel`, `unitCost`, `unitPrice`).
        unitOfMeasure: zod_1.z.string().optional(),
        unit: zod_1.z.string().optional(),
        reorderLevel: zod_1.z.number().int().min(0).optional(),
        minStock: zod_1.z.number().int().min(0).optional(),
        unitCost: zod_1.z.number().min(0).optional(),
        cost: zod_1.z.number().min(0).optional(),
        unitPrice: zod_1.z.number().min(0).optional(),
        price: zod_1.z.number().min(0).optional(),
        // Initial stock is supported by service layer; legacy UI sends `stock`.
        stock: zod_1.z.number().int().min(0).optional(),
    }),
});
exports.updateProductSchema = zod_1.z.object({
    body: exports.createProductSchema.shape.body.partial(),
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid product ID'),
    }),
});
