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
            const [rows] = yield db_js_1.pool.execute(query, values);
            return rows;
        });
    }
    static create(data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield db_js_1.pool.getConnection();
            yield connection.beginTransaction();
            try {
                const id = crypto_1.default.randomUUID();
                // 1. Create transaction record
                yield connection.execute('INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, mechanic_id, bike_id, reference_id, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
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
                yield connection.execute('UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?', [data.quantity, data.productId]);
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
}
exports.TransactionService = TransactionService;
