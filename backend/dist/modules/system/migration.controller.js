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
exports.MigrationController = void 0;
const db_js_1 = require("../../database/db.js");
const crypto_1 = __importDefault(require("crypto"));
class MigrationController {
    static importData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { inventory = [], sales = [], suppliers = [], mechanics = [], bikes = [] } = req.body;
            const connection = yield db_js_1.pool.getConnection();
            try {
                yield connection.beginTransaction();
                // 1. Categories
                const categories = [...new Set(inventory.map((p) => p.category).filter(Boolean))];
                const categoryMap = new Map();
                for (const catName of categories) {
                    yield connection.query('INSERT IGNORE INTO categories (id, name) VALUES (?, ?)', [crypto_1.default.randomUUID(), catName]);
                    const [rows] = yield connection.query('SELECT id FROM categories WHERE name = ?', [catName]);
                    if (rows.length > 0)
                        categoryMap.set(catName, rows[0].id);
                }
                // 2. Suppliers
                const supplierMap = new Map();
                for (const s of suppliers) {
                    const [existing] = yield connection.query('SELECT id FROM suppliers WHERE name = ?', [s.name]);
                    let id;
                    if (existing.length === 0) {
                        id = crypto_1.default.randomUUID();
                        yield connection.query('INSERT INTO suppliers (id, name, contact, email, phone) VALUES (?, ?, ?, ?, ?)', [id, s.name, s.contact || '', s.email || '', s.phone || '']);
                    }
                    else {
                        id = existing[0].id;
                    }
                    supplierMap.set(s.name, id);
                }
                // 3. Products & Initial Inventory
                for (const p of inventory) {
                    const [existing] = yield connection.query('SELECT id FROM products WHERE sku = ?', [p.sku]);
                    let productId;
                    if (existing.length > 0) {
                        productId = existing[0].id;
                    }
                    else {
                        productId = crypto_1.default.randomUUID();
                    }
                    const catId = categoryMap.get(p.category) || null;
                    yield connection.query(`
                    INSERT INTO products (id, sku, name, category_id, unit_cost, unit_price, reorder_level)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        category_id = VALUES(category_id),
                        unit_cost = VALUES(unit_cost),
                        unit_price = VALUES(unit_price),
                        reorder_level = VALUES(reorder_level)
                `, [productId, p.sku, p.name, catId, p.cost || 0, p.price || 0, p.minStock || 0]);
                    yield connection.query('INSERT INTO inventory (id, product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)', [crypto_1.default.randomUUID(), productId, p.stock || 0]);
                }
                // 4. Mechanics
                const mechMap = new Map();
                for (const m of mechanics) {
                    const [existing] = yield connection.query('SELECT id FROM mechanics WHERE name = ? OR unique_code = ?', [m.name, m.uniqueCode || '']);
                    let id;
                    if (existing.length === 0) {
                        id = crypto_1.default.randomUUID();
                        yield connection.query('INSERT INTO mechanics (id, code, unique_code, name, passport_number, phone, specialization) VALUES (?, ?, ?, ?, ?, ?, ?)', [
                            id,
                            m.code || '',
                            m.uniqueCode || crypto_1.default.randomUUID(),
                            m.name,
                            m.passportNumber || m.passport || '',
                            m.phone || '',
                            m.specialization || ''
                        ]);
                    }
                    else {
                        id = existing[0].id;
                    }
                    mechMap.set(m.name, id);
                }
                // 5. Bikes
                const bikeMap = new Map();
                for (const b of bikes) {
                    const [existing] = yield connection.query('SELECT id FROM bikes WHERE plate_number = ?', [b.plate]);
                    let id;
                    if (existing.length === 0) {
                        id = crypto_1.default.randomUUID();
                        yield connection.query('INSERT INTO bikes (id, plate_number, plate_category, color, ownership, registration_expiry, insurance_expiry, accident_details, customer_name, customer_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
                            id,
                            b.plate,
                            b.category || 'Private',
                            b.color || '',
                            b.ownership || '',
                            b.regExp || '',
                            b.insExp || '',
                            b.accident || '',
                            b.customer || '',
                            b.phone || ''
                        ]);
                    }
                    else {
                        id = existing[0].id;
                    }
                    bikeMap.set(b.plate, id);
                }
                // 6. Sales / Transactions
                for (const s of sales) {
                    const items = s.items || [];
                    for (const item of items) {
                        const [prodRows] = yield connection.query('SELECT id FROM products WHERE sku = ? OR name = ?', [item.sku || '', item.name || '']);
                        const prod = prodRows[0];
                        if (prod) {
                            const refId = `${s.id}_${item.sku}`;
                            yield connection.query(`
                            INSERT INTO inventory_transactions
                                (id, product_id, transaction_type, quantity, mechanic_id, bike_id, created_at, reference_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE reference_id = reference_id
                        `, [
                                crypto_1.default.randomUUID(),
                                prod.id,
                                s.type || 'sale',
                                item.qty || 1,
                                s.mechanic ? (mechMap.get(s.mechanic) || null) : null,
                                s.bike ? (bikeMap.get(s.bike) || null) : null,
                                s.date || new Date().toISOString(),
                                refId
                            ]);
                        }
                    }
                }
                yield connection.commit();
                res.json({
                    success: true,
                    message: `Migration complete: ${inventory.length} products, ${suppliers.length} suppliers, ${mechanics.length} mechanics, ${bikes.length} bikes, ${sales.length} sales imported to MySQL.`
                });
            }
            catch (error) {
                yield connection.rollback();
                console.error('[migration]: Import failed:', error);
                res.status(500).json({ success: false, error: error.message });
            }
            finally {
                connection.release();
            }
        });
    }
}
exports.MigrationController = MigrationController;
