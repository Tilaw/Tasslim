import { CategoryService } from './categories.service.js';
export class CategoryController {
    static async getAll(req, res, next) {
        try {
            const result = await CategoryService.getAll();
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async create(req, res, next) {
        try {
            const result = await CategoryService.create(req.body);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async update(req, res, next) {
        try {
            const result = await CategoryService.update(req.params.id, req.body);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async delete(req, res, next) {
        try {
            const result = await CategoryService.delete(req.params.id);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
