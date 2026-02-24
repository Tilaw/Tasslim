import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'inventory.db');

const db = new Database(dbPath);

const targetDate = '2026-02-18 12:00:00';

try {
    console.log(`[backdate]: Connecting to database at ${dbPath}`);

    // Update inventory_transactions where transaction_type is 'issue'
    const updateTx = db.prepare("UPDATE inventory_transactions SET created_at = ? WHERE transaction_type = 'issue'");
    const info = updateTx.run(targetDate);

    console.log(`[backdate]: Updated ${info.changes} records in inventory_transactions table.`);

} catch (error) {
    console.error('[backdate]: Error updating database:', error);
} finally {
    db.close();
    console.log('[backdate]: Database connection closed.');
}
