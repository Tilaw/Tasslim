import { Request, Response, NextFunction } from 'express';
import { BikeService } from './bikes.service.js';

export class BikeController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const bikes = await BikeService.getAll();
            res.json({ success: true, data: bikes });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const bike = await BikeService.getById(req.params.id as string);
            if (!bike) {
                return res.status(404).json({ success: false, error: 'Bike not found' });
            }
            res.json({ success: true, data: bike });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const bike = await BikeService.create(req.body);
            res.status(201).json({ success: true, data: bike });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const bike = await BikeService.update(req.params.id as string, req.body);
            res.json({ success: true, data: bike });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await BikeService.delete(req.params.id as string);
            res.json({ success: true, message: 'Bike deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}
