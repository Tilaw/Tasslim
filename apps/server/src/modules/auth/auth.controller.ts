import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import type { AuthRequest } from '../../middleware/auth.middleware.js';

export class AuthController {
    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: error.message },
            });
        }
    }

    static async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body;
            const result = await AuthService.refresh(refreshToken);
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(401).json({
                success: false,
                error: { code: 'INVALID_TOKEN', message: error.message || 'Invalid or expired refresh token' },
            });
        }
    }

    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.register(req.body);
            res.status(201).json({ success: true, data: result });
        } catch (error: any) {
            next(error);
        }
    }

    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.getAll();
            res.json({ success: true, data: result });
        } catch (error: any) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const deleted = await AuthService.delete(id);
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'User not found or already removed' },
                });
            }
            res.json({ success: true });
        } catch (error: any) {
            next(error);
        }
    }

    static async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const actor = req.user!;
            const result = await AuthService.updateUser(id, req.body, actor);
            res.json({ success: true, data: result });
        } catch (error: any) {
            next(error);
        }
    }
}
