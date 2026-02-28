"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSupplierSchema = exports.createSupplierSchema = void 0;
const zod_1 = require("zod");
exports.createSupplierSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Supplier name is required'),
        contactPerson: zod_1.z.string().optional(),
        email: zod_1.z.string().email('Invalid email address').optional().nullable(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
    }),
});
exports.updateSupplierSchema = zod_1.z.object({
    body: exports.createSupplierSchema.shape.body.partial(),
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid supplier ID'),
    }),
});
