import app from './app.js';
import { testConnection } from './database/db.js';
import { migrate } from './database/migrations.js';

const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        console.log('[server]: Starting server...');

        // Run database migrations
        await migrate();

        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.warn('[server]: Database connection failed, but starting server anyway...');
        }

        const server = app.listen(Number(PORT), '0.0.0.0', () => {
            console.log(`[server]: Server is running and accessible on the network at port ${PORT}`);
            console.log(`[server]: Local access: http://localhost:${PORT}`);
        });

        server.on('error', (err) => {
            console.error('[server]: Server error:', err);
        });

    } catch (error) {
        console.error('[server]: Failed to start server:', error);
    }
}

startServer();
