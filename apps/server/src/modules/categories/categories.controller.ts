import type { Request, Response, NextFunction } from 'express';
import { CategoryService } from './categories.service.js';

export class CategoryController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await CategoryService.getAll();
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await CategoryService.create(req.body);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await CategoryService.update(req.params.id as string, req.body);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await CategoryService.delete(req.params.id as string);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}
