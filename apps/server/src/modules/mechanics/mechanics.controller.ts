import { Request, Response, NextFunction } from 'express';
import { MechanicService } from './mechanics.service.js';

export class MechanicController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const mechanics = await MechanicService.getAll();
            res.json({ success: true, data: mechanics });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const mechanic = await MechanicService.getById(req.params.id as string);
            if (!mechanic) {
                return res.status(404).json({ success: false, error: 'Mechanic not found' });
            }
            res.json({ success: true, data: mechanic });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const mechanic = await MechanicService.create(req.body);
            res.status(201).json({ success: true, data: mechanic });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const mechanic = await MechanicService.update(req.params.id as string, req.body);
            res.json({ success: true, data: mechanic });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await MechanicService.delete(req.params.id as string);
            res.json({ success: true, message: 'Mechanic deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}
