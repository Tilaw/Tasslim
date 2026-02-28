"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransactionSchema = void 0;
const zod_1 = require("zod");
exports.createTransactionSchema = zod_1.z.object({
    body: zod_1.z.object({
        productId: zod_1.z.coerce.string(),
        transactionType: zod_1.z.enum(['purchase', 'sale', 'return', 'adjustment', 'issue']),
        quantity: zod_1.z.number().int().refine(n => n !== 0, 'Quantity cannot be zero'),
        mechanicId: zod_1.z.coerce.string().optional().nullable(),
        bikeId: zod_1.z.coerce.string().optional().nullable(),
        referenceId: zod_1.z.coerce.string().optional().nullable(),
        notes: zod_1.z.string().optional(),
        date: zod_1.z.string().optional(),
    }),
});
