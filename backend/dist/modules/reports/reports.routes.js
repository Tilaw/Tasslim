"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRoutes = void 0;
const express_1 = require("express");
const reports_controller_js_1 = require("./reports.controller.js");
const router = (0, express_1.Router)();
router.get('/dashboard-stats', reports_controller_js_1.ReportsController.getDashboardStats);
exports.reportRoutes = router;
