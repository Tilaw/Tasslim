"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Category name is required'),
        parentCategoryId: zod_1.z.string().uuid('Invalid parent category ID').optional().nullable(),
        description: zod_1.z.string().optional(),
    }),
});
exports.updateCategorySchema = zod_1.z.object({
    body: exports.createCategorySchema.shape.body.partial(),
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid category ID'),
    }),
});
