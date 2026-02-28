import { SupplierService } from './suppliers.service.js';
export class SupplierController {
    static async getAll(req, res, next) {
        try {
            const result = await SupplierService.getAll();
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async create(req, res, next) {
        try {
            const result = await SupplierService.create(req.body);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async update(req, res, next) {
        try {
            const result = await SupplierService.update(req.params.id, req.body);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async delete(req, res, next) {
        try {
            const result = await SupplierService.delete(req.params.id);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
