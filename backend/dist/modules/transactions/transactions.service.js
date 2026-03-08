"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const db_js_1 = require("../../database/db.js");
const crypto_1 = __importDefault(require("crypto"));
class TransactionService {
    static getAll(params) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const [rows] = yield db_js_1.pool.execute(query, values);
            return rows;
        });
    }
    /** Normalize date to MySQL DATETIME format (YYYY-MM-DD HH:mm:ss). */
    static toMySQLDateTime(value) {
        const d = value ? new Date(value) : new Date();
        const iso = d.toISOString();
        return iso.replace('T', ' ').slice(0, 19);
    }
    static create(data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield db_js_1.pool.getConnection();
            yield connection.beginTransaction();
            try {
                // Idempotency guard: avoid creating duplicate issue lines for the same
                // reference/product/type combination when clients retry or double-submit.
                if (data.referenceId) {
                    const [existing] = yield connection.execute('SELECT id FROM inventory_transactions WHERE reference_id = ? AND product_id = ? AND transaction_type = ? AND (is_reverted IS NULL OR is_reverted = 0) LIMIT 1', [data.referenceId, data.productId, data.transactionType]);
                    if (Array.isArray(existing) && existing.length > 0) {
                        // No-op – treat as success so callers can safely retry without
                        // inflating stock movements or duplicating history entries.
                        yield connection.rollback();
                        return Object.assign(Object.assign({ id: existing[0].id }, data), { duplicate: true });
                    }
                }
                const id = crypto_1.default.randomUUID();
                const createdAt = this.toMySQLDateTime(data.date);
                // 1. Create transaction record
                yield connection.execute('INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, mechanic_id, bike_id, reference_id, notes, created_by, created_at, rider_name, rider_phone, rider_id, receiver_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
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
                ]);
                // 2. Ensure inventory row exists, then apply quantity delta (issue = negative)
                yield connection.execute(`INSERT INTO inventory (id, product_id, quantity) VALUES (?, ?, 0)
                 ON DUPLICATE KEY UPDATE quantity = quantity + ?`, [crypto_1.default.randomUUID(), data.productId, data.quantity]);
                yield connection.commit();
                return Object.assign({ id }, data);
            }
            catch (error) {
                yield connection.rollback();
                throw error;
            }
            finally {
                connection.release();
            }
        });
    }
    /**
     * Revert (logically delete) an issuance/transaction group identified by referenceId.
     * This restores inventory by subtracting each transaction's quantity from the inventory total
     * and marks the original rows as reverted so they no longer appear in listings.
     */
    static revertGroup(referenceId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield db_js_1.pool.getConnection();
            yield connection.beginTransaction();
            try {
                let matchBy = 'reference_id';
                let rows = [];
                // First try to match by reference_id (multiple rows per issuance group)
                const [byRef] = yield connection.execute('SELECT id, product_id, quantity FROM inventory_transactions WHERE reference_id = ? AND (is_reverted IS NULL OR is_reverted = 0)', [referenceId]);
                rows = byRef;
                // Fallback: if nothing matched, treat the provided value as a single transaction id
                if (!rows || rows.length === 0) {
                    const [byId] = yield connection.execute('SELECT id, product_id, quantity FROM inventory_transactions WHERE id = ? AND (is_reverted IS NULL OR is_reverted = 0)', [referenceId]);
                    rows = byId;
                    matchBy = 'id';
                }
                if (!rows || rows.length === 0) {
                    yield connection.rollback();
                    const err = new Error('Issuance group not found or already reverted');
                    err.status = 404;
                    throw err;
                }
                // For each transaction line, reverse its effect on inventory.
                // Original quantity may be negative for "issue" – subtracting it restores stock.
                for (const row of rows) {
                    yield connection.execute('UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?', [row.quantity, row.product_id]);
                }
                // Mark all matched transactions as reverted
                const whereColumn = matchBy === 'reference_id' ? 'reference_id' : 'id';
                yield connection.execute(`UPDATE inventory_transactions SET is_reverted = 1 WHERE ${whereColumn} = ? AND (is_reverted IS NULL OR is_reverted = 0)`, [referenceId]);
                yield connection.commit();
                return { referenceId, revertedCount: rows.length, revertedBy: userId };
            }
            catch (error) {
                yield connection.rollback();
                throw error;
            }
            finally {
                connection.release();
            }
        });
    }
}
exports.TransactionService = TransactionService;
