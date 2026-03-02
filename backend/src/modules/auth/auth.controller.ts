import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";

export class AuthController {
    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);
            console.log("🚀 ~ AuthController ~ login ~ result:", result);
            res.json({ success: true, data: result });
        } catch (error: any) {
            console.log("🚀 ~ AuthController ~ login ~ error:", error)
            res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: error.message },
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
            const success = await AuthService.delete(id);
            res.json({ success });
        } catch (error: any) {
            next(error);
        }
    }
}
