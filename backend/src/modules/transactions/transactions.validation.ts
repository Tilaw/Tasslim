import { z } from 'zod';

const transactionItemSchema = z.object({
    productId: z.coerce.string(),
    transactionType: z.enum(['purchase', 'sale', 'return', 'adjustment', 'issue']),
    quantity: z.number().int().refine(n => n !== 0, 'Quantity cannot be zero'),
    mechanicId: z.coerce.string().optional().nullable(),
    bikeId: z.coerce.string().optional().nullable(),
    referenceId: z.coerce.string().optional().nullable(),
    notes: z.string().optional(),
    date: z.string().optional(),
    riderName: z.string().optional(),
    riderNumber: z.string().optional(),
    riderPhone: z.string().optional(),
    riderId: z.string().optional(),
    receiverName: z.string().optional(),
});

export const createTransactionSchema = z.object({
    body: transactionItemSchema,
});

export const createBatchTransactionsSchema = z.object({
    body: z.object({
        transactions: z.array(transactionItemSchema).min(1).max(50),
    }),
});
