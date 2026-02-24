import Database from 'better-sqlite3';

const db = new Database('c:/Users/Dell/Desktop/shop inventroy/backend/inventory.db');

try {
    const issues = db.prepare("SELECT * FROM inventory_transactions WHERE transaction_type = 'issue'").all();
    console.log(`Found ${issues.length} issue transactions.`);
    if (issues.length > 0) {
        console.log('Sample record:', issues[0]);
    }
} catch (error) {
    console.error('Error reading database:', error);
} finally {
    db.close();
}
