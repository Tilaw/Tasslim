import { z } from 'zod';
export const mechanicSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        code: z.string().optional(),
        uniqueCode: z.string().optional(),
        passportNumber: z.string().optional(),
        passport: z.string().optional(),
        phone: z.string().optional(),
        specialization: z.string().optional(),
    }),
});
