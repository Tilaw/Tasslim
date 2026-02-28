import { pool } from '../../database/db.js';
import crypto from 'crypto';
export class ProductService {
    static async getAll(params) {
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
        const [rows] = await pool.execute(query, values);
        return rows;
    }
    static async getById(id) {
        const [rows] = await pool.execute(`
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
    }
    static async create(data) {
        const id = crypto.randomUUID();
        await pool.execute('INSERT INTO products (id, sku, name, description, category_id, brand, model, unit_of_measure, reorder_level, unit_cost, unit_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
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
        const inventoryId = crypto.randomUUID();
        await pool.execute('INSERT INTO inventory (id, product_id, quantity) VALUES (?, ?, ?)', [inventoryId, id, data.stock || 0]);
        return { id, ...data };
    }
    static async update(id, data) {
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
            await pool.execute(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
        }
        // Handle stock update if present
        if (data.stock !== undefined) {
            await pool.execute('UPDATE inventory SET quantity = ? WHERE product_id = ?', [data.stock, id]);
        }
        return this.getById(id);
    }
    static async delete(id) {
        await pool.execute('UPDATE products SET is_active = FALSE WHERE id = ?', [id]);
        return { id, deleted: true };
    }
}
