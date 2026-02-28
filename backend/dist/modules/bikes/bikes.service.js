import { pool } from '../../database/db.js';
import crypto from 'crypto';
export class BikeService {
    static async getAll() {
        const [rows] = await pool.execute(`
            SELECT 
                id,
                plate_number AS plate,
                plate_category AS category,
                kind,
                color,
                ownership,
                registration_renew_date AS regRenew,
                registration_expiry AS regExp,
                insurance_expiry AS insExp,
                accident_details AS accident,
                customer_name AS customer,
                customer_phone AS phone,
                location,
                is_active
            FROM bikes 
            WHERE is_active = TRUE 
            ORDER BY plate_number ASC
        `);
        return rows;
    }
    static async getById(id) {
        const [rows] = await pool.execute(`
            SELECT 
                id,
                plate_number AS plate,
                plate_category AS category,
                kind,
                color,
                ownership,
                registration_renew_date AS regRenew,
                registration_expiry AS regExp,
                insurance_expiry AS insExp,
                accident_details AS accident,
                customer_name AS customer,
                customer_phone AS phone,
                location,
                is_active
            FROM bikes 
            WHERE id = ?
        `, [id]);
        return rows[0];
    }
    static async create(data) {
        const id = crypto.randomUUID();
        await pool.execute('INSERT INTO bikes (id, plate_number, plate_category, kind, color, ownership, registration_renew_date, registration_expiry, insurance_expiry, accident_details, customer_name, customer_phone, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            id,
            data.plateNumber || data.plate,
            data.plateCategory || data.category || null,
            data.kind || null,
            data.color || null,
            data.ownership || null,
            data.regRenew || null,
            data.registrationExpiry || data.regExp || null,
            data.insuranceExpiry || data.insExp || null,
            data.accidentDetails || data.accident || null,
            data.customerName || data.customer || null,
            data.customerPhone || data.phone || null,
            data.location || null
        ]);
        return { id, ...data };
    }
    static async update(id, data) {
        const fields = [];
        const values = [];
        const fieldMap = {
            plate: 'plate_number',
            plateNumber: 'plate_number',
            category: 'plate_category',
            plateCategory: 'plate_category',
            kind: 'kind',
            regRenew: 'registration_renew_date',
            regExp: 'registration_expiry',
            registrationExpiry: 'registration_expiry',
            insExp: 'insurance_expiry',
            insuranceExpiry: 'insurance_expiry',
            accident: 'accident_details',
            accidentDetails: 'accident_details',
            customer: 'customer_name',
            customerName: 'customer_name',
            phone: 'customer_phone',
            customerPhone: 'customer_phone',
            location: 'location'
        };
        Object.keys(data).forEach((key) => {
            const dbKey = fieldMap[key] || key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            if (dbKey === 'id' || dbKey === 'is_active')
                return;
            fields.push(`${dbKey} = ?`);
            values.push(data[key]);
        });
        if (fields.length === 0)
            return this.getById(id);
        values.push(id);
        await pool.execute(`UPDATE bikes SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.getById(id);
    }
    static async delete(id) {
        await pool.execute('UPDATE bikes SET is_active = FALSE WHERE id = ?', [id]);
        return { id, deleted: true };
    }
}
