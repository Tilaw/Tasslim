import { z } from 'zod';
export const createTransactionSchema = z.object({
    body: z.object({
        productId: z.coerce.string(),
        transactionType: z.enum(['purchase', 'sale', 'return', 'adjustment', 'issue']),
        quantity: z.number().int().refine(n => n !== 0, 'Quantity cannot be zero'),
        mechanicId: z.coerce.string().optional().nullable(),
        bikeId: z.coerce.string().optional().nullable(),
        referenceId: z.coerce.string().optional().nullable(),
        notes: z.string().optional(),
        date: z.string().optional(),
    }),
});
