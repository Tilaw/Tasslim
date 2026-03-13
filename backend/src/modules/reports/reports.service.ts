import { pool } from '../../database/db.js';

export class ReportsService {
    static async getDashboardStats() {
        const [productRows]: any = await pool.execute('SELECT COUNT(*) as count FROM products');
        const [supplierRows]: any = await pool.execute('SELECT COUNT(*) as count FROM suppliers');
        const [lowStockRows]: any = await pool.execute(`
            SELECT COUNT(*) as count 
            FROM products p
            JOIN inventory i ON p.id = i.product_id
            WHERE i.quantity <= p.reorder_level
        `);
        const [userRows]: any = await pool.execute('SELECT COUNT(*) as count FROM users');

        return {
            totalProducts: productRows[0].count,
            activeSuppliers: supplierRows[0].count,
            lowStockItems: lowStockRows[0].count,
            totalUsers: userRows[0].count
        };
    }

    /**
     * Compute a mechanic's active span for a given day based on their
     * inventory transactions (primarily `issue` records).
     * 
     * This does not require a separate clock-in/clock-out table – instead it
     * uses the first and last transaction timestamps as a proxy for work span.
     */
    static async getMechanicOvertime(mechanicId: string, date: string) {
        if (!mechanicId || !date) {
            throw new Error('mechanicId and date are required');
        }

        const dayStart = new Date(date);
        if (isNaN(dayStart.getTime())) {
            throw new Error('Invalid date format. Expected YYYY-MM-DD');
        }
        const yyyy = dayStart.getFullYear();
        const mm = String(dayStart.getMonth() + 1).padStart(2, '0');
        const dd = String(dayStart.getDate()).padStart(2, '0');
        const startStr = `${yyyy}-${mm}-${dd} 00:00:00`;
        const endStr = `${yyyy}-${mm}-${dd} 23:59:59`;

        const [rows]: any = await pool.execute(
            `
            SELECT 
                MIN(created_at) AS first_tx,
                MAX(created_at) AS last_tx,
                COUNT(*) AS tx_count
            FROM inventory_transactions
            WHERE mechanic_id = ?
              AND created_at BETWEEN ? AND ?
              AND (is_reverted IS NULL OR is_reverted = 0)
            `,
            [mechanicId, startStr, endStr]
        );

        const row = rows && rows[0];
        if (!row || !row.first_tx || !row.last_tx) {
            return {
                mechanicId,
                date: `${yyyy}-${mm}-${dd}`,
                hasActivity: false,
                txCount: 0,
                firstTransactionAt: null,
                lastTransactionAt: null,
                durationMinutes: 0
            };
        }

        const first = new Date(row.first_tx);
        const last = new Date(row.last_tx);
        const durationMs = last.getTime() - first.getTime();
        const durationMinutes = Math.max(0, Math.round(durationMs / 60000));

        return {
            mechanicId,
            date: `${yyyy}-${mm}-${dd}`,
            hasActivity: true,
            txCount: row.tx_count || 0,
            firstTransactionAt: first.toISOString(),
            lastTransactionAt: last.toISOString(),
            durationMinutes
        };
    }
}
