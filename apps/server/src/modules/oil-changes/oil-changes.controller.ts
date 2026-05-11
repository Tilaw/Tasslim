import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
import { OilChangeService } from './oil-changes.service.js';

export class OilChangeController {
    static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await OilChangeService.getAll(req.query);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await OilChangeService.create(req.body);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}

