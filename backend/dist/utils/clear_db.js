import { pool } from '../database/db.js';
async function clearProducts() {
    try {
        console.log('Clearing products table...');
        await pool.execute('DELETE FROM products');
        console.log('Products table cleared.');
        const [rows] = await pool.execute('SELECT COUNT(*) as count FROM products');
        console.log('New Product Count:', rows[0].count);
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
clearProducts();
