"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mechanicSchema = void 0;
const zod_1 = require("zod");
exports.mechanicSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required'),
        code: zod_1.z.string().optional(),
        uniqueCode: zod_1.z.string().optional(),
        passportNumber: zod_1.z.string().optional(),
        passport: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        specialization: zod_1.z.string().optional(),
    }),
});
