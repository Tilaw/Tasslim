import type { Response, NextFunction } from 'express';
import { TransactionService } from './transactions.service.js';
import type { AuthRequest } from '../../middleware/auth.middleware.js';

export class TransactionController {
    static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await TransactionService.getAll(req.query);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await TransactionService.create(req.body, req.user!.userId);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}
