const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'backend/inventory.db');
console.log('Opening database at:', dbPath);

try {
    const db = new Database(dbPath);

    console.log('\n--- TABLES ---');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(tables);

    console.log('\n--- RECENT TRANSACTIONS (last 10) ---');
    const transactions = db.prepare(`
        SELECT t.*, p.name as product_name 
        FROM inventory_transactions t 
        JOIN products p ON t.product_id = p.id 
        ORDER BY t.created_at DESC 
        LIMIT 10
    `).all();
    console.log(transactions);

    db.close();
} catch (err) {
    console.error('Error:', err);
}
