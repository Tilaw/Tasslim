import dotenv from 'dotenv';
import path from 'path';

// Load environment variables as early as possible
dotenv.config();
// Also try loading from one level up if we are in dist/
dotenv.config({ path: path.join(process.cwd(), '.env') });

import app from './app.js';
import { testConnection } from './database/db.js';
import { migrate } from './database/migrations.js';

const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        console.log('[server]: Starting server...');

        // Run database migrations
        console.log('[server]: Running database migrations...');
        await migrate();
        console.log('[server]: Migrations check complete.');

        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('[server]: CRITICAL: Database connection failed. Exiting...');
            process.exit(1);
        }

        const server = app.listen(PORT, () => {
            console.log(`[server]: Server is running and accessible on the network at port ${PORT}`);
            console.log(`[server]: Local access: http://localhost:${PORT}`);
            console.log(`[server]: Health check: http://localhost:${PORT}/health`);
            console.log(`[server]: API docs (Swagger UI): http://localhost:${PORT}/api/docs`);
        });

        server.on('error', (err) => {
            console.error('[server]: Server error:', err);
        });

    } catch (error) {
        console.error('[server]: Failed to start server due to an unhandled error:', error);
        process.exit(1);
    }
}

startServer();
