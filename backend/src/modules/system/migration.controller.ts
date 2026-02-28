import { Request, Response } from 'express';
import { pool } from '../../database/db.js';
import crypto from 'crypto';

export class MigrationController {
    static async importData(req: Request, res: Response) {
        const { inventory = [], sales = [], suppliers = [], mechanics = [], bikes = [] } = req.body;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Categories
            const categories = [...new Set(inventory.map((p: any) => p.category).filter(Boolean))];
            const categoryMap = new Map<string, string>();

            for (const catName of categories) {
                await connection.query('INSERT IGNORE INTO categories (id, name) VALUES (?, ?)', [crypto.randomUUID(), catName]);
                const [rows] = await connection.query('SELECT id FROM categories WHERE name = ?', [catName]);
                if ((rows as any[]).length > 0) categoryMap.set(catName as string, (rows as any[])[0].id);
            }

            // 2. Suppliers
            const supplierMap = new Map<string, string>();
            for (const s of suppliers) {
                const [existing] = await connection.query('SELECT id FROM suppliers WHERE name = ?', [s.name]);
                let id;
                if ((existing as any[]).length === 0) {
                    id = crypto.randomUUID();
                    await connection.query(
                        'INSERT INTO suppliers (id, name, contact, email, phone) VALUES (?, ?, ?, ?, ?)',
                        [id, s.name, s.contact || '', s.email || '', s.phone || '']
                    );
                } else {
                    id = (existing as any[])[0].id;
                }
                supplierMap.set(s.name, id);
            }

            // 3. Products & Initial Inventory
            for (const p of inventory) {
                const [existing] = await connection.query('SELECT id FROM products WHERE sku = ?', [p.sku]);
                let productId;
                if ((existing as any[]).length > 0) {
                    productId = (existing as any[])[0].id;
                } else {
                    productId = crypto.randomUUID();
                }

                const catId = categoryMap.get(p.category) || null;
                await connection.query(`
                    INSERT INTO products (id, sku, name, category_id, unit_cost, unit_price, reorder_level)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        category_id = VALUES(category_id),
                        unit_cost = VALUES(unit_cost),
                        unit_price = VALUES(unit_price),
                        reorder_level = VALUES(reorder_level)
                `, [productId, p.sku, p.name, catId, p.cost || 0, p.price || 0, p.minStock || 0]);

                await connection.query(
                    'INSERT INTO inventory (id, product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)',
                    [crypto.randomUUID(), productId, p.stock || 0]
                );
            }

            // 4. Mechanics
            const mechMap = new Map<string, string>();
            for (const m of mechanics) {
                const [existing] = await connection.query('SELECT id FROM mechanics WHERE name = ? OR unique_code = ?', [m.name, m.uniqueCode || '']);
                let id;
                if ((existing as any[]).length === 0) {
                    id = crypto.randomUUID();
                    await connection.query(
                        'INSERT INTO mechanics (id, code, unique_code, name, passport_number, phone, specialization) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [
                            id,
                            m.code || '',
                            m.uniqueCode || crypto.randomUUID(),
                            m.name,
                            m.passportNumber || m.passport || '',
                            m.phone || '',
                            m.specialization || ''
                        ]
                    );
                } else {
                    id = (existing as any[])[0].id;
                }
                mechMap.set(m.name, id);
            }

            // 5. Bikes
            const bikeMap = new Map<string, string>();
            for (const b of bikes) {
                const [existing] = await connection.query('SELECT id FROM bikes WHERE plate_number = ?', [b.plate]);
                let id;
                if ((existing as any[]).length === 0) {
                    id = crypto.randomUUID();
                    await connection.query(
                        'INSERT INTO bikes (id, plate_number, plate_category, color, ownership, registration_expiry, insurance_expiry, accident_details, customer_name, customer_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [
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
                        ]
                    );
                } else {
                    id = (existing as any[])[0].id;
                }
                bikeMap.set(b.plate, id);
            }

            // 6. Sales / Transactions
            for (const s of sales) {
                const items = s.items || [];
                for (const item of items) {
                    const [prodRows] = await connection.query(
                        'SELECT id FROM products WHERE sku = ? OR name = ?',
                        [item.sku || '', item.name || '']
                    );
                    const prod = (prodRows as any[])[0];

                    if (prod) {
                        const refId = `${s.id}_${item.sku}`;
                        await connection.query(`
                            INSERT INTO inventory_transactions
                                (id, product_id, transaction_type, quantity, mechanic_id, bike_id, created_at, reference_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE reference_id = reference_id
                        `, [
                            crypto.randomUUID(),
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

            await connection.commit();
            res.json({
                success: true,
                message: `Migration complete: ${inventory.length} products, ${suppliers.length} suppliers, ${mechanics.length} mechanics, ${bikes.length} bikes, ${sales.length} sales imported to MySQL.`
            });
        } catch (error: any) {
            await connection.rollback();
            console.error('[migration]: Import failed:', error);
            res.status(500).json({ success: false, error: error.message });
        } finally {
            connection.release();
        }
    }
}
