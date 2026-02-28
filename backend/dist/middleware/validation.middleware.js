import { ZodError } from 'zod';
export function validate(schema) {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid request data',
                        details: error.issues.map((issue) => ({
                            field: issue.path.join('.'),
                            message: issue.message,
                        })),
                    },
                });
            }
            next(error);
        }
    };
}
