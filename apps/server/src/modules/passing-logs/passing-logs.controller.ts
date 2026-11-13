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
            const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
            
            const bikeNumber = String(b.bikeNumber || '').trim();
            const date = String(b.date || '').trim();
            const direction = String(b.direction || '').trim();
            if (!bikeNumber || !date) {
                return res.status(400).json({ success: false, error: { message: 'bikeNumber and date are required' } });
            }
            if (!direction || !['IN', 'OUT'].includes(direction.toUpperCase())) {
                return res.status(400).json({ success: false, error: { message: 'direction must be IN or OUT' } });
            }

            // Extract file information if files were uploaded
            let handoverPaperPath: string | null = null;
            let handoverPaperOriginalName: string | null = null;
            let passingPaperPath: string | null = null;
            let passingPaperOriginalName: string | null = null;

            if (files) {
                if (files.handoverPaper && files.handoverPaper[0]) {
                    handoverPaperPath = `uploads/rider-movements/${files.handoverPaper[0].filename}`;
                    handoverPaperOriginalName = files.handoverPaper[0].originalname;
                }
                if (files.passingPaper && files.passingPaper[0]) {
                    passingPaperPath = `uploads/rider-movements/${files.passingPaper[0].filename}`;
                    passingPaperOriginalName = files.passingPaper[0].originalname;
                }
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
                direction,
                handoverPaperPath,
                handoverPaperOriginalName,
                passingPaperPath,
                passingPaperOriginalName
            });
            res.status(201).json({ success: true, data });
        } catch (e) {
            next(e);
        }
    }

    static async getRiderMovementById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const data = await PassingLogsService.getRiderMovementById(id);
            if (!data) {
                return res.status(404).json({ success: false, error: { message: 'Movement not found' } });
            }
            res.json({ success: true, data });
        } catch (e) {
            next(e);
        }
    }
}
