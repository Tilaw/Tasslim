import { pool } from '../../database/db.js';
import crypto from 'crypto';

export class SupplierService {
    static async getAll() {
        const [rows] = await pool.execute('SELECT * FROM suppliers WHERE is_active = TRUE ORDER BY name ASC');
        return rows;
    }

    static async getById(id: string) {
        const [rows]: any = await pool.execute('SELECT * FROM suppliers WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(data: any) {
        const id = crypto.randomUUID();
        await pool.execute(
            'INSERT INTO suppliers (id, name, contact, email, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
            [id, data.name, data.contact || null, data.email || null, data.phone || null, data.address || null]
        );
        return { id, ...data };
    }

    static async update(id: string, data: any) {
        const fields: string[] = [];
        const values: any[] = [];

        const fieldMap: Record<string, string> = {
            contactPerson: 'contact',
            contact: 'contact'
        };

        Object.keys(data).forEach((key) => {
            const dbKey = fieldMap[key] || key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            fields.push(`${dbKey} = ?`);
            values.push(data[key]);
        });
        if (fields.length === 0) return this.getById(id);
        values.push(id);
        await pool.execute(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.getById(id);
    }

    static async delete(id: string) {
        await pool.execute('UPDATE suppliers SET is_active = FALSE WHERE id = ?', [id]);
        return { id, deleted: true };
    }
}
