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

    static async getMechanicOvertime(req: Request, res: Response, next: NextFunction) {
        try {
            const mechanicId = (req.query.mechanicId || req.query.mechanic_id) as string;
            const date = (req.query.date || '') as string;
            const result = await ReportsService.getMechanicOvertime(mechanicId, date);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}
