import { pool } from '../../database/db.js';
import crypto from 'crypto';

export class MechanicService {
    static async getAll() {
        const [rows] = await pool.execute(`
            SELECT 
                id,
                code,
                unique_code AS uniqueCode,
                name,
                passport_number AS passportNumber,
                phone,
                specialization,
                is_active
            FROM mechanics 
            WHERE is_active = TRUE 
            ORDER BY name ASC
        `);
        return rows;
    }

    static async getById(id: string) {
        const [rows]: any = await pool.execute(`
            SELECT 
                id,
                code,
                unique_code AS uniqueCode,
                name,
                passport_number AS passportNumber,
                phone,
                specialization,
                is_active
            FROM mechanics 
            WHERE id = ?
        `, [id]);
        return rows[0];
    }

    static async create(data: any) {
        const id = crypto.randomUUID();
        await pool.execute(
            'INSERT INTO mechanics (id, code, unique_code, name, passport_number, phone, specialization) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                id,
                data.code || null,
                data.uniqueCode || null,
                data.name,
                data.passportNumber || data.passport || null,
                data.phone || null,
                data.specialization || null
            ]
        );
        return { id, ...data };
    }

    static async update(id: string, data: any) {
        const fields: string[] = [];
        const values: any[] = [];

        const fieldMap: Record<string, string> = {
            uniqueCode: 'unique_code',
            passport: 'passport_number',
            passportNumber: 'passport_number'
        };

        Object.keys(data).forEach((key) => {
            const dbKey = fieldMap[key] || key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            if (dbKey === 'id' || dbKey === 'is_active') return;
            fields.push(`${dbKey} = ?`);
            values.push(data[key]);
        });
        if (fields.length === 0) return this.getById(id);
        values.push(id);
        await pool.execute(`UPDATE mechanics SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.getById(id);
    }

    static async delete(id: string) {
        await pool.execute('UPDATE mechanics SET is_active = FALSE WHERE id = ?', [id]);
        return { id, deleted: true };
    }
}
