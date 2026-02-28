import { pool } from '../../database/db.js';
export class ReportsService {
    static async getDashboardStats() {
        const [productRows] = await pool.execute('SELECT COUNT(*) as count FROM products');
        const [supplierRows] = await pool.execute('SELECT COUNT(*) as count FROM suppliers');
        const [lowStockRows] = await pool.execute(`
            SELECT COUNT(*) as count 
            FROM products p
            JOIN inventory i ON p.id = i.product_id
            WHERE i.quantity <= p.reorder_level
        `);
        const [userRows] = await pool.execute('SELECT COUNT(*) as count FROM users');
        return {
            totalProducts: productRows[0].count,
            activeSuppliers: supplierRows[0].count,
            lowStockItems: lowStockRows[0].count,
            totalUsers: userRows[0].count
        };
    }
}
