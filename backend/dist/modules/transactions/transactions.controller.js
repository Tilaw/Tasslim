import { TransactionService } from './transactions.service.js';
export class TransactionController {
    static async getAll(req, res, next) {
        try {
            const result = await TransactionService.getAll(req.query);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async create(req, res, next) {
        try {
            const result = await TransactionService.create(req.body, req.user.userId);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
