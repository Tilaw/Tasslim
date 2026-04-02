import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validation.middleware.js';
import { loginSchema, registerSchema, refreshSchema, updateUserSchema } from './auth.validation.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Public auth endpoints
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshSchema), AuthController.refresh);

// User management endpoints – restricted to admin-level roles
router.post(
    '/register',
    authMiddleware,
    requireRole('super_admin', 'admin'),
    validate(registerSchema),
    AuthController.register
);

router.get(
    '/',
    authMiddleware,
    requireRole('super_admin', 'admin'),
    AuthController.getAll
);

router.delete(
    '/:id',
    authMiddleware,
    requireRole('super_admin', 'admin'),
    AuthController.delete
);

// Update a user's own credentials (or admin can update any user)
router.patch(
    '/:id',
    authMiddleware,
    validate(updateUserSchema),
    AuthController.update
);

export const authRoutes = router;
