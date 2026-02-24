import { z } from 'zod';

export const bikeSchema = z.object({
    body: z.object({
        plate: z.string().min(1, 'Plate number is required'),
        category: z.string().optional(),
        kind: z.string().optional(),
        color: z.string().optional(),
        ownership: z.string().optional(),
        regRenew: z.string().optional(),
        regExp: z.string().optional(),
        insExp: z.string().optional(),
        accident: z.string().optional(),
        customer: z.string().optional(),
        phone: z.string().optional(),
        location: z.string().optional(),
    }),
});
