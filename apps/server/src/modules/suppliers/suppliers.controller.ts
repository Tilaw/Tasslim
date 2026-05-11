import type { Request, Response, NextFunction } from 'express';
import { SupplierService } from './suppliers.service.js';

export class SupplierController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await SupplierService.getAll();
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await SupplierService.create(req.body);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await SupplierService.update(req.params.id as string, req.body);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await SupplierService.delete(req.params.id as string);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}
