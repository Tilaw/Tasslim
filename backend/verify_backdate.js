import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'inventory.db');

const db = new Database(dbPath);

try {
    const issues = db.prepare("SELECT created_at, COUNT(*) as count FROM inventory_transactions WHERE transaction_type = 'issue' GROUP BY created_at").all();
    console.log('[verify]: Grouped transactions by created_at:');
    issues.forEach(row => {
        console.log(`- ${row.created_at}: ${row.count} records`);
    });
} catch (error) {
    console.error('[verify]: Error reading database:', error);
} finally {
    db.close();
}
