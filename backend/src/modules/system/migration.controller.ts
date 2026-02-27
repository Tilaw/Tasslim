import { Request, Response } from 'express';
import { db } from '../../database/db.js';
import crypto from 'crypto';

export class MigrationController {
    static async importData(req: Request, res: Response) {
        const { inventory = [], sales = [], suppliers = [], mechanics = [], bikes = [] } = req.body;

        try {
            const transaction = db.transaction(() => {
                // 1. Categories (extract from products)
                const categories = [...new Set(inventory.map((p: any) => p.category).filter(Boolean))];
                const categoryMap = new Map<string, string>();

                const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (id, name) VALUES (?, ?)');
                for (const catName of categories) {
                    const id = crypto.randomUUID();
                    insertCategory.run(id, catName);
                    const row = db.prepare('SELECT id FROM categories WHERE name = ?').get(catName) as any;
                    if (row) categoryMap.set(catName as string, row.id);
                }

                // 2. Suppliers
                const supplierMap = new Map<string, string>();
                const insertSupplier = db.prepare(
                    'INSERT OR IGNORE INTO suppliers (id, name, contact, email, phone) VALUES (?, ?, ?, ?, ?)'
                );
                for (const s of suppliers) {
                    // Check if exists first to keep existing ID
                    let row = db.prepare('SELECT id FROM suppliers WHERE name = ?').get(s.name) as any;
                    if (!row) {
                        const id = crypto.randomUUID();
                        insertSupplier.run(id, s.name, s.contact || '', s.email || '', s.phone || '');
                        row = { id };
                    }
                    if (row) supplierMap.set(s.name, row.id);
                }

                // 3. Products & Initial Inventory
                const insertProduct = db.prepare(`
                    INSERT INTO products (id, sku, name, category_id, unit_cost, unit_price, reorder_level)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(sku) DO UPDATE SET
                        name = excluded.name,
                        category_id = excluded.category_id,
                        unit_cost = excluded.unit_cost,
                        unit_price = excluded.unit_price,
                        reorder_level = excluded.reorder_level
                `);
                const insertInv = db.prepare(
                    'INSERT OR IGNORE INTO inventory (id, product_id, quantity) VALUES (?, ?, ?)'
                );

                for (const p of inventory) {
                    let productId;
                    const existingProd = db.prepare('SELECT id FROM products WHERE sku = ?').get(p.sku) as any;

                    if (existingProd) {
                        productId = existingProd.id;
                    } else {
                        productId = crypto.randomUUID();
                    }

                    const catId = categoryMap.get(p.category) || null;
                    insertProduct.run(productId, p.sku, p.name, catId, p.cost || 0, p.price || 0, p.minStock || 0);

                    // For inventory, if it exists, we might not want to overwrite it during migration if it's already in DB
                    // Usually migration is from LocalStorage to DB once.
                    insertInv.run(crypto.randomUUID(), productId, p.stock || 0);
                }

                // 4. Mechanics
                const mechMap = new Map<string, string>();
                const insertMech = db.prepare(
                    'INSERT OR IGNORE INTO mechanics (id, code, unique_code, name, passport_number, phone, specialization) VALUES (?, ?, ?, ?, ?, ?, ?)'
                );
                for (const m of mechanics) {
                    let row = db.prepare('SELECT id FROM mechanics WHERE name = ? OR unique_code = ?').get(m.name, m.uniqueCode || '') as any;
                    if (!row) {
                        const id = crypto.randomUUID();
                        insertMech.run(
                            id,
                            m.code || '',
                            m.uniqueCode || crypto.randomUUID(),
                            m.name,
                            m.passportNumber || m.passport || '',
                            m.phone || '',
                            m.specialization || ''
                        );
                        row = { id };
                    }
                    if (row) mechMap.set(m.name, row.id);
                }

                // 5. Bikes
                const bikeMap = new Map<string, string>();
                const insertBike = db.prepare(
                    'INSERT OR IGNORE INTO bikes (id, plate_number, plate_category, color, ownership, registration_expiry, insurance_expiry, accident_details, customer_name, customer_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
                );
                for (const b of bikes) {
                    const id = crypto.randomUUID();
                    insertBike.run(
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
                    );
                    const row = db.prepare('SELECT id FROM bikes WHERE plate_number = ?').get(b.plate) as any;
                    if (row) bikeMap.set(b.plate, row.id);
                }

                // 6. Sales / Transactions
                const insertTrans = db.prepare(`
                    INSERT INTO inventory_transactions
                        (id, product_id, transaction_type, quantity, mechanic_id, bike_id, created_at, reference_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(reference_id) DO NOTHING
                `);

                for (const s of sales) {
                    const items = s.items || [];
                    for (const item of items) {
                        const prod = db.prepare(
                            'SELECT id FROM products WHERE sku = ? OR name = ?'
                        ).get(item.sku || '', item.name || '') as any;

                        if (prod) {
                            // Use concatenated s.id and sku to handle multiple items in one sale
                            const refId = `${s.id}_${item.sku}`;
                            insertTrans.run(
                                crypto.randomUUID(),
                                prod.id,
                                s.type || 'sale',
                                item.qty || 1,
                                s.mechanic ? (mechMap.get(s.mechanic) || null) : null,
                                s.bike ? (bikeMap.get(s.bike) || null) : null,
                                s.date || new Date().toISOString(),
                                refId
                            );
                        }
                    }
                }
            });

            transaction();

            res.json({
                success: true,
                message: `Migration complete: ${inventory.length} products, ${suppliers.length} suppliers, ${mechanics.length} mechanics, ${bikes.length} bikes, ${sales.length} sales imported.`
            });
        } catch (error: any) {
            console.error('[migration]: Import failed:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
