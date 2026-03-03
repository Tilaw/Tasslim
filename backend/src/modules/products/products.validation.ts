import { z } from 'zod';

export const createProductSchema = z.object({
    body: z.object({
        sku: z.string().min(1, 'SKU is required'),
        name: z.string().min(1, 'Product name is required'),
        description: z.string().optional(),
        // Legacy frontend sends `category` as a name; newer API can send `categoryId`.
        categoryId: z.string().uuid('Invalid category ID').optional(),
        category: z.string().min(1).optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        // Accept both legacy (`unit`, `minStock`, `cost`, `price`) and API (`unitOfMeasure`, `reorderLevel`, `unitCost`, `unitPrice`).
        unitOfMeasure: z.string().optional(),
        unit: z.string().optional(),
        reorderLevel: z.number().int().min(0).optional(),
        minStock: z.number().int().min(0).optional(),
        unitCost: z.number().min(0).optional(),
        cost: z.number().min(0).optional(),
        unitPrice: z.number().min(0).optional(),
        price: z.number().min(0).optional(),
        // Initial stock is supported by service layer; legacy UI sends `stock`.
        stock: z.number().int().min(0).optional(),
    }),
});

export const updateProductSchema = z.object({
    body: createProductSchema.shape.body.partial(),
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
});
