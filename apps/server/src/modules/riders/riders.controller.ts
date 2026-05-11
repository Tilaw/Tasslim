import { Request, Response, NextFunction } from 'express';
import { RiderService } from './riders.service.js';

export class RiderController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const riders = await RiderService.getAll();
            res.json({ success: true, data: riders });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const rider = await RiderService.getById(req.params.id as string);
            if (!rider) {
                return res.status(404).json({ success: false, error: 'Rider not found' });
            }
            res.json({ success: true, data: rider });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const rider = await RiderService.create(req.body);
            res.status(201).json({ success: true, data: rider });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const rider = await RiderService.update(req.params.id as string, req.body);
            res.json({ success: true, data: rider });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await RiderService.delete(req.params.id as string);
            if (!result.deleted) {
                return res.status(404).json({ success: false, error: 'Rider not found' });
            }
            res.json({ success: true, message: 'Rider deleted successfully' });
        } catch (error) {
            next(error);
        }
    }

    static async deleteAllImported(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await RiderService.deleteAllImported();
            res.json({ success: true, data: { deletedCount: result.deletedCount } });
        } catch (error) {
            next(error);
        }
    }
}
