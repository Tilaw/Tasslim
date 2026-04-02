import { z } from 'zod';

export const loginSchema = z.object({
    body: z.object({
        email: z.string().min(1, 'Email or username is required'), // Accept email OR username
        password: z.string().min(1, 'Password is required'),
    }),
});

export const refreshSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
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

export const updateUserSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'User ID is required'),
    }),
    body: z.object({
        email: z.string().min(1, 'Email or username is required').optional(),
        currentPassword: z.string().min(1, 'Current password is required').optional(),
        password: z
            .string()
            .min(6, 'Password must be at least 6 characters')
            .optional(),
    }),
});
