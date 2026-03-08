import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { getContext } from './issue-context.controller.js';

const router = Router();
router.get('/', authMiddleware, getContext);

export const issueContextRoutes = router;
