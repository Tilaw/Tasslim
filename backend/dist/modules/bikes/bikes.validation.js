"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bikeSchema = void 0;
const zod_1 = require("zod");
exports.bikeSchema = zod_1.z.object({
    body: zod_1.z.object({
        plate: zod_1.z.string().min(1, 'Plate number is required'),
        category: zod_1.z.string().optional(),
        kind: zod_1.z.string().optional(),
        color: zod_1.z.string().optional(),
        ownership: zod_1.z.string().optional(),
        regRenew: zod_1.z.string().optional(),
        regExp: zod_1.z.string().optional(),
        insExp: zod_1.z.string().optional(),
        accident: zod_1.z.string().optional(),
        customer: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
    }),
});
