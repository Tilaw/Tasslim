import { Router } from 'express';
import { ReportsController } from './reports.controller.js';

const router = Router();

router.get('/dashboard-stats', ReportsController.getDashboardStats);

export const reportRoutes = router;
