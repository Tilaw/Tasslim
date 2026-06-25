import { pool } from '../../database/db.js';
import crypto from 'crypto';

export type TransactionListParams = {
    type?: string;
    productId?: string;
    productName?: string;
    mechanicId?: string;
    mechanicName?: string;
    bikeId?: string;
    bikePlate?: string;
    startDate?: string;
    endDate?: string;
    limit?: number | string;
    cursor?: string;
    includeTotal?: boolean | string;
};

type CursorPayload = { d: string; i: string };

type PaginatedResult<T> = {
    rows: T[];
    nextCursor: string | null;
    hasMore: boolean;
    total?: number;
};

export class TransactionService {
    private static readonly GROUP_KEY_SQL = `COALESCE(t.reference_id, CONCAT('tx_', DATE_FORMAT(t.created_at, '%Y-%m-%d %H:%i:%s'), '_', IFNULL(t.mechanic_id, '')))`;

    private static readonly LINE_SELECT = `
      SELECT t.*, COALESCE(p.name, '(unknown product)') as product_name, COALESCE(p.sku, '') as product_sku,
      u.first_name, u.last_name, m.name as mechanic_name, b.plate_number as bike_plate_number
      FROM inventory_transactions t
      LEFT JOIN products p ON t.product_id = p.id
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN mechanics m ON t.mechanic_id = m.id
      LEFT JOIN bikes b ON t.bike_id = b.id
    `;

    private static parseLimit(value: unknown, fallback: number, max: number): number {
        const parsed = parseInt(String(value ?? ''), 10);
        if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
        return Math.min(parsed, max);
    }

    private static encodeCursor(createdAt: string | Date, id: string): string {
        const d = createdAt instanceof Date
            ? createdAt.toISOString().replace('T', ' ').slice(0, 19)
            : String(createdAt).replace('T', ' ').slice(0, 19);
        return Buffer.from(JSON.stringify({ d, i: id } satisfies CursorPayload)).toString('base64url');
    }

    private static decodeCursor(cursor?: string): CursorPayload | null {
        if (!cursor) return null;
        try {
            const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as CursorPayload;
            if (!parsed?.d || !parsed?.i) return null;
            return parsed;
        } catch {
            return null;
        }
    }

    private static toStartDateTime(value?: string): string | null {
        if (!value) return null;
        const trimmed = value.trim();
        if (!trimmed) return null;
        return trimmed.length <= 10 ? `${trimmed} 00:00:00` : trimmed.replace('T', ' ').slice(0, 19);
    }

    private static toEndDateTime(value?: string): string | null {
        if (!value) return null;
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (trimmed.length <= 10) return `${trimmed} 23:59:59`;
        return trimmed.replace('T', ' ').slice(0, 19);
    }

    private static appendFilters(
        params: TransactionListParams,
        values: any[],
        options: { includeProductJoin?: boolean } = {}
    ): string {
        let clause = ' WHERE (t.is_reverted IS NULL OR t.is_reverted = 0)';

        if (params.type) {
            clause += ' AND t.transaction_type = ?';
            values.push(params.type);
        }

        if (params.productId) {
            clause += ' AND t.product_id = ?';
            values.push(params.productId);
        }

        if (params.mechanicId) {
            clause += ' AND t.mechanic_id = ?';
            values.push(params.mechanicId);
        }

        if (params.mechanicName) {
            clause += ' AND m.name = ?';
            values.push(params.mechanicName);
        }

        if (params.bikeId) {
            clause += ' AND t.bike_id = ?';
            values.push(params.bikeId);
        }

        if (params.bikePlate) {
            clause += ' AND b.plate_number = ?';
            values.push(params.bikePlate);
        }

        if (params.productName) {
            if (options.includeProductJoin) {
                clause += ' AND p.name = ?';
            } else {
                clause += ` AND EXISTS (
                    SELECT 1 FROM products p2
                    WHERE p2.id = t.product_id AND p2.name = ?
                )`;
            }
            values.push(params.productName);
        }

        const startDate = this.toStartDateTime(params.startDate);
        if (startDate) {
            clause += ' AND t.created_at >= ?';
            values.push(startDate);
        }

        const endDate = this.toEndDateTime(params.endDate);
        if (endDate) {
            clause += ' AND t.created_at <= ?';
            values.push(endDate);
        }

        return clause;
    }

    private static groupKeyFromRow(row: any): string {
        if (row.reference_id) return row.reference_id;
        const createdAt = row.created_at instanceof Date
            ? row.created_at.toISOString().replace('T', ' ').slice(0, 19)
            : String(row.created_at || '').replace('T', ' ').slice(0, 19);
        return `tx_${createdAt}_${row.mechanic_id || ''}`;
    }

    private static mapLineToItem(row: any) {
        return {
            productId: row.product_id,
            name: row.product_name,
            sku: row.product_sku,
            qty: Math.abs(Number(row.quantity) || 0),
            price: row.unit_price != null ? Number(row.unit_price) : 0,
            total: 0,
        };
    }

    private static mapGroupRows(groupRows: any[], lines: any[]) {
        const lineMap = new Map<string, any[]>();
        for (const line of lines) {
            const key = this.groupKeyFromRow(line);
            if (!lineMap.has(key)) lineMap.set(key, []);
            lineMap.get(key)!.push(line);
        }

        return groupRows.map((group) => {
            const groupLines = lineMap.get(group.group_key) || [];
            const first = groupLines[0] || {};
            const rawType = first.transaction_type != null ? first.transaction_type : first.transactionType;

            return {
                id: group.reference_id || first.id || group.group_key,
                referenceId: group.reference_id || null,
                groupKey: group.group_key,
                date: group.group_date,
                type: String(rawType || group.transaction_type || '').toLowerCase(),
                items: groupLines.map((line) => this.mapLineToItem(line)),
                mechanic: first.mechanic_name || group.mechanic_name || '',
                bike: first.bike_plate_number || group.bike_plate_number || '',
                status: 'completed',
                user: `${first.first_name || ''} ${first.last_name || ''}`.trim(),
                total: 0,
                riderName: first.rider_name || group.rider_name || '',
                riderNumber: first.rider_phone || group.rider_phone || '',
                riderId: first.rider_id || group.rider_id || '',
                receiverName: first.receiver_name || group.receiver_name || '',
            };
        });
    }

    static async getAll(params: TransactionListParams): Promise<PaginatedResult<any>> {
        const limit = this.parseLimit(params.limit, 200, 1000);
        const fetchLimit = limit + 1;
        const values: any[] = [];
        let query = this.LINE_SELECT + this.appendFilters(params, values, { includeProductJoin: true });

        const cursor = this.decodeCursor(params.cursor);
        if (cursor) {
            query += ' AND (t.created_at < ? OR (t.created_at = ? AND t.id < ?))';
            values.push(cursor.d, cursor.d, cursor.i);
        }

        query += ' ORDER BY t.created_at DESC, t.id DESC';
        query += ` LIMIT ${fetchLimit}`;

        const [rows] = await pool.execute(query, values);
        const list = rows as any[];
        const hasMore = list.length > limit;
        const pageRows = hasMore ? list.slice(0, limit) : list;
        const last = pageRows[pageRows.length - 1];

        return {
            rows: pageRows,
            nextCursor: hasMore && last ? this.encodeCursor(last.created_at, last.id) : null,
            hasMore,
        };
    }

    static async getGroups(params: TransactionListParams): Promise<PaginatedResult<any>> {
        const limit = this.parseLimit(params.limit, 50, 200);
        const fetchLimit = limit + 1;
        const values: any[] = [];

        const innerValues: any[] = [];
        const innerWhere = this.appendFilters(params, innerValues, { includeProductJoin: true });

        let groupQuery = `
            SELECT
                ${this.GROUP_KEY_SQL} AS group_key,
                MAX(t.reference_id) AS reference_id,
                MAX(t.created_at) AS group_date,
                MAX(t.id) AS cursor_id,
                MAX(t.transaction_type) AS transaction_type,
                MAX(m.name) AS mechanic_name,
                MAX(b.plate_number) AS bike_plate_number,
                MAX(t.rider_name) AS rider_name,
                MAX(t.rider_phone) AS rider_phone,
                MAX(t.rider_id) AS rider_id,
                MAX(t.receiver_name) AS receiver_name
            FROM inventory_transactions t
            LEFT JOIN products p ON t.product_id = p.id
            LEFT JOIN mechanics m ON t.mechanic_id = m.id
            LEFT JOIN bikes b ON t.bike_id = b.id
            ${innerWhere}
            GROUP BY group_key
        `;

        let wrapped = `SELECT * FROM (${groupQuery}) g WHERE 1=1`;
        values.push(...innerValues);

        const cursor = this.decodeCursor(params.cursor);
        if (cursor) {
            wrapped += ' AND (g.group_date < ? OR (g.group_date = ? AND g.cursor_id < ?))';
            values.push(cursor.d, cursor.d, cursor.i);
        }

        wrapped += ' ORDER BY g.group_date DESC, g.cursor_id DESC';
        wrapped += ` LIMIT ${fetchLimit}`;

        const [groupRows] = await pool.execute(wrapped, values);
        const groups = groupRows as any[];
        const hasMore = groups.length > limit;
        const pageGroups = hasMore ? groups.slice(0, limit) : groups;

        if (pageGroups.length === 0) {
            const includeTotal = params.includeTotal === true || params.includeTotal === 'true' || params.includeTotal === '1';
            const total = includeTotal ? await this.countGroups(params) : undefined;
            return { rows: [], nextCursor: null, hasMore: false, total };
        }

        const groupKeys = pageGroups.map((group) => group.group_key);
        const placeholders = groupKeys.map(() => '?').join(', ');
        const lineValues = [...groupKeys];
        const lineQuery = `
            ${this.LINE_SELECT}
            WHERE (t.is_reverted IS NULL OR t.is_reverted = 0)
              AND ${this.GROUP_KEY_SQL} IN (${placeholders})
            ORDER BY t.created_at DESC, t.id DESC
        `;
        const [lineRows] = await pool.execute(lineQuery, lineValues);

        const mappedGroups = this.mapGroupRows(pageGroups, lineRows as any[]);
        const last = pageGroups[pageGroups.length - 1];
        const includeTotal = params.includeTotal === true || params.includeTotal === 'true' || params.includeTotal === '1';
        const total = includeTotal ? await this.countGroups(params) : undefined;

        return {
            rows: mappedGroups,
            nextCursor: hasMore && last ? this.encodeCursor(last.group_date, last.cursor_id) : null,
            hasMore,
            total,
        };
    }

    static async getProductSummary(params: TransactionListParams) {
        const values: any[] = [];
        const where = this.appendFilters(params, values, { includeProductJoin: true });
        const query = `
            SELECT
                t.product_id AS productId,
                COALESCE(p.name, '(unknown product)') AS productName,
                COALESCE(p.sku, '') AS productSku,
                SUM(ABS(t.quantity)) AS totalQty
            FROM inventory_transactions t
            LEFT JOIN products p ON t.product_id = p.id
            LEFT JOIN mechanics m ON t.mechanic_id = m.id
            LEFT JOIN bikes b ON t.bike_id = b.id
            ${where}
            GROUP BY t.product_id, p.name, p.sku
            ORDER BY totalQty DESC
        `;

        const [rows] = await pool.execute(query, values);
        return (rows as any[]).map((row) => ({
            productId: row.productId,
            productName: row.productName,
            productSku: row.productSku,
            totalQty: Number(row.totalQty) || 0,
        }));
    }

    static async getGroupsSummary(params: TransactionListParams) {
        const values: any[] = [];
        const where = this.appendFilters(params, values, { includeProductJoin: true });
        const query = `
            SELECT
                COUNT(*) AS total_groups,
                COALESCE(SUM(line_count), 0) AS total_lines,
                COALESCE(SUM(part_qty), 0) AS total_parts
            FROM (
                SELECT
                    ${this.GROUP_KEY_SQL} AS group_key,
                    COUNT(*) AS line_count,
                    SUM(ABS(t.quantity)) AS part_qty
                FROM inventory_transactions t
                LEFT JOIN products p ON t.product_id = p.id
                LEFT JOIN mechanics m ON t.mechanic_id = m.id
                LEFT JOIN bikes b ON t.bike_id = b.id
                ${where}
                GROUP BY group_key
            ) grouped
        `;

        const [rows] = await pool.execute(query, values);
        const summary = (rows as any[])[0] || {};

        return {
            totalGroups: Number(summary.total_groups) || 0,
            totalLines: Number(summary.total_lines) || 0,
            totalParts: Number(summary.total_parts) || 0,
        };
    }

    private static async countGroups(params: TransactionListParams): Promise<number> {
        const values: any[] = [];
        const where = this.appendFilters(params, values, { includeProductJoin: true });
        const query = `
            SELECT COUNT(*) AS total_groups
            FROM (
                SELECT ${this.GROUP_KEY_SQL} AS group_key
                FROM inventory_transactions t
                LEFT JOIN products p ON t.product_id = p.id
                LEFT JOIN mechanics m ON t.mechanic_id = m.id
                LEFT JOIN bikes b ON t.bike_id = b.id
                ${where}
                GROUP BY group_key
            ) grouped
        `;
        const [rows] = await pool.execute(query, values);
        return Number((rows as any[])[0]?.total_groups) || 0;
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
            if (data.referenceId) {
                const [existing]: any = await connection.execute(
                    'SELECT id FROM inventory_transactions WHERE reference_id = ? AND product_id = ? AND transaction_type = ? AND (is_reverted IS NULL OR is_reverted = 0) LIMIT 1',
                    [data.referenceId, data.productId, data.transactionType]
                );

                if (Array.isArray(existing) && existing.length > 0) {
                    await connection.rollback();
                    return { id: existing[0].id, ...data, duplicate: true };
                }
            }

            const id = crypto.randomUUID();
            const createdAt = this.toMySQLDateTime(data.date);
            const lineUnitPrice = this.normalizeUnitPrice(data.unitPrice);

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
     */
    static async revertGroup(referenceId: string, userId: string) {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            let rows: any[] = [];

            const [byRef]: any = await connection.execute(
                'SELECT id, product_id, quantity FROM inventory_transactions WHERE reference_id = ? AND (is_reverted IS NULL OR is_reverted = 0)',
                [referenceId]
            );
            rows = byRef;

            if (!rows || rows.length === 0) {
                const [byId]: any = await connection.execute(
                    'SELECT id, product_id, quantity, created_at, mechanic_id, reference_id FROM inventory_transactions WHERE id = ? AND (is_reverted IS NULL OR is_reverted = 0)',
                    [referenceId]
                );
                const one = Array.isArray(byId) && byId.length > 0 ? byId[0] : null;
                if (one) {
                    if (one.reference_id) {
                        const [byRef2]: any = await connection.execute(
                            'SELECT id, product_id, quantity FROM inventory_transactions WHERE reference_id = ? AND (is_reverted IS NULL OR is_reverted = 0)',
                            [one.reference_id]
                        );
                        rows = byRef2;
                    } else {
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

            for (const row of rows) {
                await connection.execute(
                    'UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?',
                    [row.quantity, row.product_id]
                );
            }

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
