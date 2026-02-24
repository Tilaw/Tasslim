import { pool } from '../../database/db.js';

export class CategoryService {
    static async getAll() {
        const [rows] = await pool.execute('SELECT * FROM categories WHERE is_active = TRUE ORDER BY name ASC');
        return rows;
    }

    static async getById(id: string) {
        const [rows]: any = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(data: any) {
        const id = crypto.randomUUID();
        await pool.execute(
            'INSERT INTO categories (id, name, parent_category_id, description) VALUES (?, ?, ?, ?)',
            [id, data.name, data.parentCategoryId || null, data.description || null]
        );
        return { id, ...data };
    }

    static async update(id: string, data: any) {
        const fields: string[] = [];
        const values: any[] = [];
        Object.keys(data).forEach((key) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            fields.push(`${snakeKey} = ?`);
            values.push(data[key]);
        });
        if (fields.length === 0) return this.getById(id);
        values.push(id);
        await pool.execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.getById(id);
    }

    static async delete(id: string) {
        await pool.execute('UPDATE categories SET is_active = FALSE WHERE id = ?', [id]);
        return { id, deleted: true };
    }
}
