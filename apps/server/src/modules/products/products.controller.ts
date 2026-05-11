import { Request, Response, NextFunction } from 'express';
import { ProductService } from './products.service.js';

export class ProductController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await ProductService.getAll(req.query);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await ProductService.getById(req.params.id as string);
            if (!result) return res.status(404).json({ success: false, error: 'Product not found' });
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await ProductService.create(req.body);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await ProductService.update(req.params.id as string, req.body);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await ProductService.delete(req.params.id as string);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}
