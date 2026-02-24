import { z } from 'zod';

export const createProductSchema = z.object({
    body: z.object({
        sku: z.string().min(1, 'SKU is required'),
        name: z.string().min(1, 'Product name is required'),
        description: z.string().optional(),
        categoryId: z.string().uuid('Invalid category ID'),
        brand: z.string().optional(),
        model: z.string().optional(),
        unitOfMeasure: z.string().default('piece'),
        reorderLevel: z.number().int().min(0).default(0),
        unitCost: z.number().min(0).default(0),
        unitPrice: z.number().min(0).default(0),
    }),
});

export const updateProductSchema = z.object({
    body: createProductSchema.shape.body.partial(),
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
});
