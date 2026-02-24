import { pool } from '../../database/db.js';

export class ReportsService {
    static async getDashboardStats() {
        const [productRows]: any = await pool.execute('SELECT COUNT(*) as count FROM products');
        const [supplierRows]: any = await pool.execute('SELECT COUNT(*) as count FROM suppliers');
        const [lowStockRows]: any = await pool.execute('SELECT COUNT(*) as count FROM products WHERE quantity <= min_stock_level');
        const [userRows]: any = await pool.execute('SELECT COUNT(*) as count FROM users');

        return {
            totalProducts: productRows[0].count,
            activeSuppliers: supplierRows[0].count,
            lowStockItems: lowStockRows[0].count,
            totalUsers: userRows[0].count
        };
    }
}
