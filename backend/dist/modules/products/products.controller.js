import { ProductService } from './products.service.js';
export class ProductController {
    static async getAll(req, res, next) {
        try {
            const result = await ProductService.getAll(req.query);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async getById(req, res, next) {
        try {
            const result = await ProductService.getById(req.params.id);
            if (!result)
                return res.status(404).json({ success: false, error: 'Product not found' });
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async create(req, res, next) {
        try {
            const result = await ProductService.create(req.body);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async update(req, res, next) {
        try {
            const result = await ProductService.update(req.params.id, req.body);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async delete(req, res, next) {
        try {
            const result = await ProductService.delete(req.params.id);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
