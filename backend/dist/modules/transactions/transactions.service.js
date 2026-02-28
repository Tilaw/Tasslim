import { pool } from '../../database/db.js';
import crypto from 'crypto';
export class TransactionService {
    static async getAll(params) {
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
        const values = [];
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
    static async create(data, userId) {
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        try {
            const id = crypto.randomUUID();
            // 1. Create transaction record
            await connection.execute('INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, mechanic_id, bike_id, reference_id, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
                id,
                data.productId,
                data.transactionType,
                data.quantity,
                data.mechanicId || null,
                data.bikeId || null,
                data.referenceId || null,
                data.notes || null,
                userId,
                data.date || new Date().toISOString().replace('T', ' ').slice(0, 19)
            ]);
            // 2. Update inventory quantity
            await connection.execute('UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?', [data.quantity, data.productId]);
            await connection.commit();
            return { id, ...data };
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
}
