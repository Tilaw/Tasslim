import { pool } from '../../database/db.js';
import crypto from 'crypto';

export class TransactionService {
    static async getAll(params: any) {
        let query = `
      SELECT t.*, p.name as product_name, p.sku as product_sku, u.first_name, u.last_name, 
      m.name as mechanic_name, b.plate_number as bike_plate_number
      FROM inventory_transactions t 
      JOIN products p ON t.product_id = p.id 
      LEFT JOIN users u ON t.created_by = u.id 
      LEFT JOIN mechanics m ON t.mechanic_id = m.id
      LEFT JOIN bikes b ON t.bike_id = b.id
      WHERE 1=1
    `;
        const values: any[] = [];

        if (params.productId) {
            query += ' AND t.product_id = ?';
            values.push(params.productId);
        }

        if (params.type) {
            query += ' AND t.transaction_type = ?';
            values.push(params.type);
        }

        query += ' ORDER BY t.created_at DESC';

        const [rows] = await pool.execute(query, values);
        return rows;
    }

    /** Normalize date to MySQL DATETIME format (YYYY-MM-DD HH:mm:ss). */
    private static toMySQLDateTime(value: string | Date | undefined): string {
        const d = value ? new Date(value) : new Date();
        const iso = d.toISOString();
        return iso.replace('T', ' ').slice(0, 19);
    }

    static async create(data: any, userId: string) {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const id = crypto.randomUUID();
            const createdAt = this.toMySQLDateTime(data.date);

            // 1. Create transaction record
            await connection.execute(
                'INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, mechanic_id, bike_id, reference_id, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    id,
                    data.productId,
                    data.transactionType,
                    data.quantity,
                    data.mechanicId || null,
                    data.bikeId || null,
                    data.referenceId || null,
                    data.notes || null,
                    userId,
                    createdAt
                ]
            );

            // 2. Ensure inventory row exists, then apply quantity delta (issue = negative)
            await connection.execute(
                `INSERT INTO inventory (id, product_id, quantity) VALUES (?, ?, 0)
                 ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
                [crypto.randomUUID(), data.productId, data.quantity]
            );

            await connection.commit();
            return { id, ...data };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}
