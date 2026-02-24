import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../inventory.db');

export const db = new Database(dbPath, { verbose: console.log });

// Compatibility wrapper for the mysql2 "pool.execute" pattern
export const pool = {
    execute: async (sql: string, params: any[] = []) => {
        try {
            // SQLite uses ? just like MySQL
            const stmt = db.prepare(sql);
            if (sql.trim().toLowerCase().startsWith('select')) {
                const rows = stmt.all(...params);
                return [rows];
            } else {
                const info = stmt.run(...params);
                return [info];
            }
        } catch (error) {
            console.error('[database]: Query execution failed!');
            console.error('[database]: SQL:', sql);
            console.error('[database]: Params:', JSON.stringify(params));
            console.error('[database]: Error:', error);
            throw error;
        }
    },
    // For transactions
    getConnection: async () => ({
        release: () => { },
        execute: pool.execute,
        beginTransaction: async () => { db.prepare('BEGIN').run(); },
        commit: async () => { db.prepare('COMMIT').run(); },
        rollback: async () => { db.prepare('ROLLBACK').run(); },
    })
};

export async function testConnection() {
    try {
        db.pragma('journal_mode = WAL');
        console.log('[database]: SQLite connected successfully at', dbPath);
        return true;
    } catch (error) {
        console.error('[database]: SQLite connection failed:', error);
        return false;
    }
}
