import { MechanicService } from './mechanics.service.js';
export class MechanicController {
    static async getAll(req, res, next) {
        try {
            const mechanics = await MechanicService.getAll();
            res.json({ success: true, data: mechanics });
        }
        catch (error) {
            next(error);
        }
    }
    static async getById(req, res, next) {
        try {
            const mechanic = await MechanicService.getById(req.params.id);
            if (!mechanic) {
                return res.status(404).json({ success: false, error: 'Mechanic not found' });
            }
            res.json({ success: true, data: mechanic });
        }
        catch (error) {
            next(error);
        }
    }
    static async create(req, res, next) {
        try {
            const mechanic = await MechanicService.create(req.body);
            res.status(201).json({ success: true, data: mechanic });
        }
        catch (error) {
            next(error);
        }
    }
    static async update(req, res, next) {
        try {
            const mechanic = await MechanicService.update(req.params.id, req.body);
            res.json({ success: true, data: mechanic });
        }
        catch (error) {
            next(error);
        }
    }
    static async delete(req, res, next) {
        try {
            await MechanicService.delete(req.params.id);
            res.json({ success: true, message: 'Mechanic deleted successfully' });
        }
        catch (error) {
            next(error);
        }
    }
}
