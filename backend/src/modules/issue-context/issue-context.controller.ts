import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
import { getIssueContext } from './issue-context.service.js';

export async function getContext(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const data = await getIssueContext();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
}
