"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// ESM module path replaced by global __dirname in CommonJS.
const auth_routes_js_1 = require("./modules/auth/auth.routes.js");
const products_routes_js_1 = require("./modules/products/products.routes.js");
const categories_routes_js_1 = require("./modules/categories/categories.routes.js");
const suppliers_routes_js_1 = require("./modules/suppliers/suppliers.routes.js");
const transactions_routes_js_1 = require("./modules/transactions/transactions.routes.js");
const mechanics_routes_js_1 = require("./modules/mechanics/mechanics.routes.js");
const bikes_routes_js_1 = require("./modules/bikes/bikes.routes.js");
const reports_routes_js_1 = require("./modules/reports/reports.routes.js");
const migration_routes_js_1 = require("./modules/system/migration.routes.js");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use((0, cors_1.default)({
    origin: true, // Allow all origins (needed for file:// static HTML)
    credentials: true,
}));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Compression
app.use((0, compression_1.default)());
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API routes
app.use('/api/v1/auth', auth_routes_js_1.authRoutes);
app.use('/api/v1/products', products_routes_js_1.productRoutes);
app.use('/api/v1/categories', categories_routes_js_1.categoryRoutes);
app.use('/api/v1/suppliers', suppliers_routes_js_1.supplierRoutes);
app.use('/api/v1/transactions', transactions_routes_js_1.transactionRoutes);
app.use('/api/v1/mechanics', mechanics_routes_js_1.mechanicRoutes);
app.use('/api/v1/bikes', bikes_routes_js_1.bikeRoutes);
app.use('/api/v1/reports', reports_routes_js_1.reportRoutes);
app.use('/api/v1/migration', migration_routes_js_1.migrationRoutes);
// Serve Static Frontend Files
const frontendPath = path_1.default.join(__dirname, '../../');
app.use(express_1.default.static(frontendPath));
// Fallback to index.html for unknown routes (allows SPA-like routing or graceful landing)
app.use((req, res, next) => {
    // Let API 404s fall through to the API error handler
    if (req.path.startsWith('/api/'))
        return next();
    res.sendFile(path_1.default.join(frontendPath, 'index.html'));
});
// Error handling middleware (placeholder)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: err.message || 'Something went wrong',
        },
    });
});
exports.default = app;
