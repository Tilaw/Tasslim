import { pool } from '../../database/db.js';
import crypto from 'crypto';

export class RiderService {
    static async getAll() {
        const [rows] = await pool.execute(`
            SELECT id, name, phone, plates, imported,
                   created_at AS createdAt, updated_at AS updatedAt
            FROM riders
            ORDER BY name ASC
        `);
        return rows;
    }

    static async getById(id: string) {
        const [rows]: any = await pool.execute(
            `SELECT id, name, phone, plates, imported, created_at AS createdAt, updated_at AS updatedAt
             FROM riders WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

    static async create(data: { name: string; phone: string; plates?: string; imported?: boolean }) {
        const id = crypto.randomUUID();
        await pool.execute(
            'INSERT INTO riders (id, name, phone, plates, imported) VALUES (?, ?, ?, ?, ?)',
            [
                id,
                data.name,
                data.phone,
                data.plates || '',
                data.imported ? 1 : 0
            ]
        );
        return this.getById(id);
    }

    static async update(id: string, data: Partial<{ name: string; phone: string; plates: string }>) {
        const updates: string[] = [];
        const values: any[] = [];
        if (data.name !== undefined) {
            updates.push('name = ?');
            values.push(data.name);
        }
        if (data.phone !== undefined) {
            updates.push('phone = ?');
            values.push(data.phone);
        }
        if (data.plates !== undefined) {
            updates.push('plates = ?');
            values.push(data.plates);
        }
        if (updates.length === 0) return this.getById(id);
        values.push(id);
        await pool.execute(`UPDATE riders SET ${updates.join(', ')} WHERE id = ?`, values);
        return this.getById(id);
    }

    static async delete(id: string) {
        const [result]: any = await pool.execute('DELETE FROM riders WHERE id = ?', [id]);
        return { id, deleted: result.affectedRows > 0 };
    }

    /** Delete all riders marked as imported (for "Delete All Imported" action) */
    static async deleteAllImported() {
        const [result]: any = await pool.execute('DELETE FROM riders WHERE imported = 1');
        return { deletedCount: result.affectedRows || 0 };
    }
}
