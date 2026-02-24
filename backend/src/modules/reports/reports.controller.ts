import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service.js';

export class ReportsController {
    static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await ReportsService.getDashboardStats();
            res.json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }
}
