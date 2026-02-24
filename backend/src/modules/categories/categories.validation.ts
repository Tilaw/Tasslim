import { z } from 'zod';

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Category name is required'),
        parentCategoryId: z.string().uuid('Invalid parent category ID').optional().nullable(),
        description: z.string().optional(),
    }),
});

export const updateCategorySchema = z.object({
    body: createCategorySchema.shape.body.partial(),
    params: z.object({
        id: z.string().uuid('Invalid category ID'),
    }),
});
