import { z } from 'zod';

export const loginSchema = z.object({
    body: z.object({
        email: z.string().min(1, 'Email or username is required'), // Accept email OR username
        password: z.string().min(1, 'Password is required'),
    }),
});

export const registerSchema = z.object({
    body: z.object({
        email: z.string().min(1, 'Email or username is required'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().optional(),
        roleId: z.string().uuid('Invalid role ID').optional(),
        role: z.string().optional(),
    }),
});
