import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Global Error Handler Middleware
 */
export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    const code = err.code || 'INTERNAL_ERROR';

    // Log the error details with stack trace for 500s
    if (status >= 500) {
        logger.error(`Unhandled Exception at ${req.method} ${req.path}`, err);
    } else {
        logger.warn(`${req.method} ${req.path} - ${status} ${message}`);
    }

    res.status(status).json({
        success: false,
        error: {
            code,
            message: process.env.NODE_ENV === 'production' && status >= 500
                ? 'An unexpected error occurred. Please try again later.'
                : message,
            details: process.env.NODE_ENV !== 'production' ? err.details : undefined
        }
    });
};

/**
 * API 404 Not Found Handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
    logger.warn(`API Route Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Endpoint ${req.method} ${req.path} not found`
        }
    });
};
