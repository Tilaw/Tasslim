import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'inventory.db');

console.log('--- DB INSPECTION START ---');
console.log('Database Path:', dbPath);

try {
    const db = new Database(dbPath);

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables found:', tables.map(t => t.name).join(', '));

    for (const table of tables) {
        if (['users', 'products', 'inventory', 'inventory_transactions', 'categories', 'suppliers', 'mechanics', 'bikes'].includes(table.name)) {
            const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
            console.log(`Table '${table.name}' count: ${count.count}`);

            if (table.name === 'inventory_transactions' && count.count > 0) {
                console.log(`\n--- PREVIEW: ${table.name} ---`);
                const rows = db.prepare(`SELECT * FROM ${table.name} LIMIT 5`).all();
                console.log(JSON.stringify(rows, null, 2));
            }
        }
    }

    db.close();
} catch (err) {
    console.error('CRITICAL ERROR:', err);
}
console.log('--- DB INSPECTION END ---');
