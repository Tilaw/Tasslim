import { AuthService } from './auth.service.js';
export class AuthController {
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: error.message },
            });
        }
    }
    static async register(req, res, next) {
        try {
            const result = await AuthService.register(req.body);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async getAll(req, res, next) {
        try {
            const result = await AuthService.getAll();
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async delete(req, res, next) {
        try {
            const id = req.params.id;
            const success = await AuthService.delete(id);
            res.json({ success });
        }
        catch (error) {
            next(error);
        }
    }
}
