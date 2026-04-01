import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
import { PassingLogsService } from './passing-logs.service.js';

export class PassingLogsController {
    static async listDubai(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = await PassingLogsService.listDubaiEntries(req.query.limit as string | undefined);
            res.json({ success: true, data });
        } catch (e) {
            next(e);
        }
    }

    static async createDubai(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const entries = (req.body as any)?.entries;
            if (!Array.isArray(entries) || entries.length === 0) {
                return res.status(400).json({ success: false, error: { message: 'entries array required' } });
            }
            if (entries.length > 50) {
                return res.status(400).json({ success: false, error: { message: 'Maximum 50 lines per submit' } });
            }
            const normalized = entries.map((e: any) => ({
                bikeNumber: String(e.bikeNumber || '').trim(),
                partName: String(e.partName || '').trim(),
                quantity: e.quantity
            }));
            for (const row of normalized) {
                if (!row.bikeNumber || !row.partName) {
                    return res.status(400).json({ success: false, error: { message: 'Each row needs bike number and part name' } });
                }
            }
            const data = await PassingLogsService.createDubaiEntries(normalized);
            res.status(201).json({ success: true, data });
        } catch (e) {
            next(e);
        }
    }

    static async listRiderMovements(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = await PassingLogsService.listRiderMovements(req.query.limit as string | undefined);
            res.json({ success: true, data });
        } catch (e) {
            next(e);
        }
    }

    static async createRiderMovement(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const b = req.body as any;
            const bikeNumber = String(b.bikeNumber || '').trim();
            const date = String(b.date || '').trim();
            const direction = String(b.direction || '').trim();
            if (!bikeNumber || !date) {
                return res.status(400).json({ success: false, error: { message: 'bikeNumber and date are required' } });
            }
            if (!direction || !['IN', 'OUT'].includes(direction.toUpperCase())) {
                return res.status(400).json({ success: false, error: { message: 'direction must be IN or OUT' } });
            }
            const data = await PassingLogsService.createRiderMovement({
                bikeNumber,
                phone: b.phone,
                riderName: b.riderName,
                riderId: b.riderId,
                city: b.city,
                company: b.company,
                date,
                time: b.time,
                direction
            });
            res.status(201).json({ success: true, data });
        } catch (e) {
            next(e);
        }
    }
}
