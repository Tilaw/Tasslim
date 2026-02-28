"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        sku: zod_1.z.string().min(1, 'SKU is required'),
        name: zod_1.z.string().min(1, 'Product name is required'),
        description: zod_1.z.string().optional(),
        categoryId: zod_1.z.string().uuid('Invalid category ID'),
        brand: zod_1.z.string().optional(),
        model: zod_1.z.string().optional(),
        unitOfMeasure: zod_1.z.string().default('piece'),
        reorderLevel: zod_1.z.number().int().min(0).default(0),
        unitCost: zod_1.z.number().min(0).default(0),
        unitPrice: zod_1.z.number().min(0).default(0),
    }),
});
exports.updateProductSchema = zod_1.z.object({
    body: exports.createProductSchema.shape.body.partial(),
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid product ID'),
    }),
});
