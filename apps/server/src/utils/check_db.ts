import { pool } from '../database/db.js';

async function checkCount() {
    try {
        const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM products');
        console.log('Product Count:', rows[0].count);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkCount();
