import { ReportsService } from './reports.service.js';
export class ReportsController {
    static async getDashboardStats(req, res, next) {
        try {
            const stats = await ReportsService.getDashboardStats();
            res.json({ success: true, data: stats });
        }
        catch (error) {
            next(error);
        }
    }
}
