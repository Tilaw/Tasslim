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
      WHERE (t.is_reverted IS NULL OR t.is_reverted = 0)
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
                'INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, mechanic_id, bike_id, reference_id, notes, created_by, created_at, rider_name, rider_phone, rider_id, receiver_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
                    createdAt,
                    data.riderName || null,
                    data.riderNumber || data.riderPhone || null,
                    data.riderId || null,
                    data.receiverName || null
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

    /**
     * Revert (logically delete) an issuance/transaction group identified by referenceId.
     * This restores inventory by subtracting each transaction's quantity from the inventory total
     * and marks the original rows as reverted so they no longer appear in listings.
     */
    static async revertGroup(referenceId: string, userId: string) {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            let matchBy: 'reference_id' | 'id' = 'reference_id';
            let rows: any[] = [];

            // First try to match by reference_id (multiple rows per issuance group)
            const [byRef]: any = await connection.execute(
                'SELECT id, product_id, quantity FROM inventory_transactions WHERE reference_id = ? AND (is_reverted IS NULL OR is_reverted = 0)',
                [referenceId]
            );
            rows = byRef;

            // Fallback: if nothing matched, treat the provided value as a single transaction id
            if (!rows || rows.length === 0) {
                const [byId]: any = await connection.execute(
                    'SELECT id, product_id, quantity FROM inventory_transactions WHERE id = ? AND (is_reverted IS NULL OR is_reverted = 0)',
                    [referenceId]
                );
                rows = byId;
                matchBy = 'id';
            }

            if (!rows || rows.length === 0) {
                await connection.rollback();
                const err: any = new Error('Issuance group not found or already reverted');
                err.status = 404;
                throw err;
            }

            // For each transaction line, reverse its effect on inventory.
            // Original quantity may be negative for "issue" – subtracting it restores stock.
            for (const row of rows) {
                await connection.execute(
                    'UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?',
                    [row.quantity, row.product_id]
                );
            }

            // Mark all matched transactions as reverted
            const whereColumn = matchBy === 'reference_id' ? 'reference_id' : 'id';
            await connection.execute(
                `UPDATE inventory_transactions SET is_reverted = 1 WHERE ${whereColumn} = ? AND (is_reverted IS NULL OR is_reverted = 0)`,
                [referenceId]
            );

            await connection.commit();
            return { referenceId, revertedCount: rows.length, revertedBy: userId };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}
