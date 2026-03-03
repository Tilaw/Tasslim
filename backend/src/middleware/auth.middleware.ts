import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}

export async function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'No token provided',
                },
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            userId: string;
            email: string;
            role: string;
        };

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid or expired token',
            },
        });
    }
}

export function requireRole(...allowedRoles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
            });
        }

        // Role compatibility / legacy aliases:
        // - DB migrations seed an "admin" role (standard administrative access)
        // - Many routes historically allowed only "super_admin"
        // Treat these as equivalent for authorization checks.
        const roleAliases: Record<string, string[]> = {
            admin: ['super_admin'],
            super_admin: ['admin'],
        };

        const userRole = req.user.role;
        const effectiveRoles = new Set<string>([
            userRole,
            ...(roleAliases[userRole] || []),
        ]);

        const hasAllowedRole = allowedRoles.some((r) => effectiveRoles.has(r));

        if (!hasAllowedRole) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Insufficient permissions',
                },
            });
        }

        next();
    };
}
