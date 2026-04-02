"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.registerSchema = exports.refreshSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().min(1, 'Email or username is required'), // Accept email OR username
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
exports.refreshSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
    }),
});
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().min(1, 'Email or username is required'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        firstName: zod_1.z.string().min(1, 'First name is required'),
        lastName: zod_1.z.string().optional(),
        roleId: zod_1.z.string().uuid('Invalid role ID').optional(),
        role: zod_1.z.string().optional(),
    }),
});
exports.updateUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'User ID is required'),
    }),
    body: zod_1.z.object({
        email: zod_1.z.string().min(1, 'Email or username is required').optional(),
        currentPassword: zod_1.z.string().min(1, 'Current password is required').optional(),
        password: zod_1.z
            .string()
            .min(6, 'Password must be at least 6 characters')
            .optional(),
    }),
});
