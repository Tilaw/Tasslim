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
exports.ProductService = void 0;
const db_js_1 = require("../../database/db.js");
const crypto_1 = __importDefault(require("crypto"));
class ProductService {
    static getAll(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = `
            SELECT 
                p.id,
                p.sku,
                p.name,
                p.description,
                p.category_id AS categoryId,
                p.brand,
                p.model,
                p.unit_of_measure AS unit,
                p.reorder_level AS minStock,
                p.unit_cost AS cost,
                p.unit_price AS price,
                p.is_active,
                p.created_at,
                p.updated_at,
                c.name as category,
                i.quantity as stock
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            LEFT JOIN inventory i ON p.id = i.product_id
            WHERE p.is_active = TRUE
        `;
            const values = [];
            if (params.search) {
                query += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
                values.push(`%${params.search}%`, `%${params.search}%`);
            }
            if (params.categoryId) {
                query += ' AND p.category_id = ?';
                values.push(params.categoryId);
            }
            const [rows] = yield db_js_1.pool.execute(query, values);
            return rows;
        });
    }
    static getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_js_1.pool.execute(`
            SELECT 
                p.id,
                p.sku,
                p.name,
                p.description,
                p.category_id AS categoryId,
                p.brand,
                p.model,
                p.unit_of_measure AS unit,
                p.reorder_level AS minStock,
                p.unit_cost AS cost,
                p.unit_price AS price,
                p.is_active,
                p.created_at,
                p.updated_at,
                c.name as category 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ?
        `, [id]);
            return rows[0];
        });
    }
    static create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = crypto_1.default.randomUUID();
            yield db_js_1.pool.execute('INSERT INTO products (id, sku, name, description, category_id, brand, model, unit_of_measure, reorder_level, unit_cost, unit_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
                id,
                data.sku,
                data.name,
                data.description || null,
                data.categoryId || data.category || null,
                data.brand || null,
                data.model || null,
                data.unit || data.unitOfMeasure || 'piece',
                data.minStock || data.reorderLevel || 0,
                data.cost || data.unitCost || 0,
                data.price || data.unitPrice || 0,
            ]);
            // Initialize inventory record
            const inventoryId = crypto_1.default.randomUUID();
            yield db_js_1.pool.execute('INSERT INTO inventory (id, product_id, quantity) VALUES (?, ?, ?)', [inventoryId, id, data.stock || 0]);
            return Object.assign({ id }, data);
        });
    }
    static update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = [];
            const values = [];
            const fieldMap = {
                cost: 'unit_cost',
                unitCost: 'unit_cost',
                price: 'unit_price',
                unitPrice: 'unit_price',
                minStock: 'reorder_level',
                reorderLevel: 'reorder_level',
                unit: 'unit_of_measure',
                unitOfMeasure: 'unit_of_measure',
                category: 'category_id',
                categoryId: 'category_id'
            };
            Object.keys(data).forEach((key) => {
                // Handle special mapping or fall back to snake_case
                const dbKey = fieldMap[key] || key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                // Skip stock if passed here, as it belongs to inventory table
                if (key === 'stock' || dbKey === 'id' || dbKey === 'is_active')
                    return;
                fields.push(`${dbKey} = ?`);
                values.push(data[key]);
            });
            if (fields.length > 0) {
                values.push(id);
                yield db_js_1.pool.execute(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
            }
            // Handle stock update if present
            if (data.stock !== undefined) {
                yield db_js_1.pool.execute('UPDATE inventory SET quantity = ? WHERE product_id = ?', [data.stock, id]);
            }
            return this.getById(id);
        });
    }
    static delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_js_1.pool.execute('UPDATE products SET is_active = FALSE WHERE id = ?', [id]);
            return { id, deleted: true };
        });
    }
}
exports.ProductService = ProductService;
