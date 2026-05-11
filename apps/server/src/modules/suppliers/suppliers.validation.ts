import { z } from 'zod';

export const createSupplierSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Supplier name is required'),
        contactPerson: z.string().optional(),
        email: z.string().email('Invalid email address').optional().nullable(),
        phone: z.string().optional(),
        address: z.string().optional(),
    }),
});

export const updateSupplierSchema = z.object({
    body: createSupplierSchema.shape.body.partial(),
    params: z.object({
        id: z.string().uuid('Invalid supplier ID'),
    }),
});
