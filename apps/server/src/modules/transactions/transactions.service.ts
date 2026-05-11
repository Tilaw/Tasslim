import { pool } from '../../database/db.js';
import crypto from 'crypto';

export class TransactionService {
    static async getAll(params: any) {
        let query = `
      SELECT t.*, COALESCE(p.name, '(unknown product)') as product_name, COALESCE(p.sku, '') as product_sku, u.first_name, u.last_name, 
      m.name as mechanic_name, b.plate_number as bike_plate_number
      FROM inventory_transactions t 
      LEFT JOIN products p ON t.product_id = p.id 
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

        const limit = Math.min(Math.max(0, parseInt(params.limit, 10) || 0), 500);
        if (limit > 0) query += ' LIMIT ' + limit;

        const [rows] = await pool.execute(query, values);
        return rows;
    }

    /** Normalize date to MySQL DATETIME format (YYYY-MM-DD HH:mm:ss). */
    private static toMySQLDateTime(value: string | Date | undefined): string {
        const d = value ? new Date(value) : new Date();
        const iso = d.toISOString();
        return iso.replace('T', ' ').slice(0, 19);
    }

    private static normalizeUnitPrice(value: unknown): number | null {
        if (value === null || value === undefined || value === '') return null;
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) return null;
        return n;
    }

    /** On purchase, persist line unit price and refresh product unit_cost when provided */
    private static async applyPurchasePricing(connection: any, productId: string, transactionType: string, unitPrice: number | null) {
        if (transactionType !== 'purchase' || unitPrice === null) return;
        await connection.execute('UPDATE products SET unit_cost = ? WHERE id = ?', [unitPrice, productId]);
    }

    static async create(data: any, userId: string) {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Idempotency guard: avoid creating duplicate issue lines for the same
            // reference/product/type combination when clients retry or double-submit.
            if (data.referenceId) {
                const [existing]: any = await connection.execute(
                    'SELECT id FROM inventory_transactions WHERE reference_id = ? AND product_id = ? AND transaction_type = ? AND (is_reverted IS NULL OR is_reverted = 0) LIMIT 1',
                    [data.referenceId, data.productId, data.transactionType]
                );

                if (Array.isArray(existing) && existing.length > 0) {
                    // No-op – treat as success so callers can safely retry without
                    // inflating stock movements or duplicating history entries.
                    await connection.rollback();
                    return { id: existing[0].id, ...data, duplicate: true };
                }
            }

            const id = crypto.randomUUID();
            const createdAt = this.toMySQLDateTime(data.date);
            const lineUnitPrice = this.normalizeUnitPrice(data.unitPrice);

            // 1. Create transaction record
            await connection.execute(
                'INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, mechanic_id, bike_id, reference_id, notes, created_by, created_at, rider_name, rider_phone, rider_id, receiver_name, unit_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
                    data.receiverName || null,
                    lineUnitPrice
                ]
            );

            // 2. Ensure inventory row exists, then apply quantity delta (issue = negative)
            await connection.execute(
                `INSERT INTO inventory (id, product_id, quantity) VALUES (?, ?, 0)
                 ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
                [crypto.randomUUID(), data.productId, data.quantity]
            );

            await this.applyPurchasePricing(connection, data.productId, data.transactionType, lineUnitPrice);

            await connection.commit();
            return { id, ...data };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /** Create multiple transaction lines in one DB transaction (e.g. one issuance with N parts). */
    static async createBatch(items: any[], userId: string) {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const created: any[] = [];
            for (const data of items) {
                if (data.referenceId) {
                    const [existing]: any = await connection.execute(
                        'SELECT id FROM inventory_transactions WHERE reference_id = ? AND product_id = ? AND transaction_type = ? AND (is_reverted IS NULL OR is_reverted = 0) LIMIT 1',
                        [data.referenceId, data.productId, data.transactionType]
                    );
                    if (Array.isArray(existing) && existing.length > 0) {
                        created.push({ id: existing[0].id, ...data, duplicate: true });
                        continue;
                    }
                }

                const id = crypto.randomUUID();
                const createdAt = this.toMySQLDateTime(data.date);
                const lineUnitPrice = this.normalizeUnitPrice(data.unitPrice);
                await connection.execute(
                    'INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, mechanic_id, bike_id, reference_id, notes, created_by, created_at, rider_name, rider_phone, rider_id, receiver_name, unit_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        id, data.productId, data.transactionType, data.quantity,
                        data.mechanicId || null, data.bikeId || null, data.referenceId || null, data.notes || null,
                        userId, createdAt,
                        data.riderName || null, data.riderNumber || data.riderPhone || null, data.riderId || null, data.receiverName || null,
                        lineUnitPrice
                    ]
                );
                await connection.execute(
                    `INSERT INTO inventory (id, product_id, quantity) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
                    [crypto.randomUUID(), data.productId, data.quantity]
                );
                await this.applyPurchasePricing(connection, data.productId, data.transactionType, lineUnitPrice);
                created.push({ id, ...data });
            }
            await connection.commit();
            return created;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Revert (logically delete) an issuance/transaction group identified by referenceId.
     * Restores inventory for each line and marks rows as reverted so they no longer appear in listings.
     * When matching by single transaction id, also reverts sibling rows (same created_at + mechanic_id)
     * so the whole logical group is removed and never "remains" in the DB.
     */
    static async revertGroup(referenceId: string, userId: string) {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            let rows: any[] = [];

            // 1) Try to match by reference_id (normal case: one issuance = one reference_id, multiple rows)
            const [byRef]: any = await connection.execute(
                'SELECT id, product_id, quantity FROM inventory_transactions WHERE reference_id = ? AND (is_reverted IS NULL OR is_reverted = 0)',
                [referenceId]
            );
            rows = byRef;

            // 2) Fallback: treat as single transaction id (e.g. legacy groups without reference_id)
            if (!rows || rows.length === 0) {
                const [byId]: any = await connection.execute(
                    'SELECT id, product_id, quantity, created_at, mechanic_id, reference_id FROM inventory_transactions WHERE id = ? AND (is_reverted IS NULL OR is_reverted = 0)',
                    [referenceId]
                );
                const one = Array.isArray(byId) && byId.length > 0 ? byId[0] : null;
                if (one) {
                    // If this row has reference_id, revert entire group by reference_id
                    if (one.reference_id) {
                        const [byRef2]: any = await connection.execute(
                            'SELECT id, product_id, quantity FROM inventory_transactions WHERE reference_id = ? AND (is_reverted IS NULL OR is_reverted = 0)',
                            [one.reference_id]
                        );
                        rows = byRef2;
                    } else {
                        // Legacy: no reference_id – revert all siblings (same created_at + mechanic_id)
                        const [siblings]: any = await connection.execute(
                            `SELECT id, product_id, quantity FROM inventory_transactions 
                             WHERE (is_reverted IS NULL OR is_reverted = 0) 
                             AND created_at = ? AND (mechanic_id <=> ?) 
                             AND transaction_type = 'issue'`,
                            [one.created_at, one.mechanic_id]
                        );
                        rows = siblings || [];
                    }
                }
            }

            if (!rows || rows.length === 0) {
                await connection.rollback();
                const err: any = new Error('Issuance group not found or already reverted');
                err.status = 404;
                throw err;
            }

            // Restore inventory for each transaction (issue = negative qty, so subtract qty to restore)
            for (const row of rows) {
                await connection.execute(
                    'UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?',
                    [row.quantity, row.product_id]
                );
            }

            // Mark all matched rows as reverted (by their ids so we don't touch other groups)
            const ids = rows.map((r: any) => r.id);
            const placeholders = ids.map(() => '?').join(',');
            await connection.execute(
                `UPDATE inventory_transactions SET is_reverted = 1 WHERE id IN (${placeholders}) AND (is_reverted IS NULL OR is_reverted = 0)`,
                ids
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
