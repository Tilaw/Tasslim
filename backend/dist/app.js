import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { authRoutes } from './modules/auth/auth.routes.js';
import { productRoutes } from './modules/products/products.routes.js';
import { categoryRoutes } from './modules/categories/categories.routes.js';
import { supplierRoutes } from './modules/suppliers/suppliers.routes.js';
import { transactionRoutes } from './modules/transactions/transactions.routes.js';
import { mechanicRoutes } from './modules/mechanics/mechanics.routes.js';
import { bikeRoutes } from './modules/bikes/bikes.routes.js';
import { reportRoutes } from './modules/reports/reports.routes.js';
import { migrationRoutes } from './modules/system/migration.routes.js';
// Load environment variables
dotenv.config();
const app = express();
// Security middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(cors({
    origin: true, // Allow all origins (needed for file:// static HTML)
    credentials: true,
}));
// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Compression
app.use(compression());
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/mechanics', mechanicRoutes);
app.use('/api/v1/bikes', bikeRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/migration', migrationRoutes);
// Serve Static Frontend Files
const frontendPath = path.join(__dirname, '../../');
app.use(express.static(frontendPath));
// Fallback to index.html for unknown routes (allows SPA-like routing or graceful landing)
app.use((req, res, next) => {
    // Let API 404s fall through to the API error handler
    if (req.path.startsWith('/api/'))
        return next();
    res.sendFile(path.join(frontendPath, 'index.html'));
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
export default app;
