import { pool } from '../../database/db.js';
import crypto from 'crypto';

export class OilChangeService {
    private static toMySQLDateTime(value: string | Date | undefined): string {
        const d = value ? new Date(value) : new Date();
        const iso = d.toISOString();
        return iso.replace('T', ' ').slice(0, 19);
    }

    static async getAll(params: any) {
        let query = `
            SELECT 
                oc.id,
                oc.bike_id AS bikeId,
                oc.mechanic_id AS mechanicId,
                oc.change_date AS changeDate,
                oc.oil_type AS oilType,
                oc.mileage,
                oc.rider_name AS riderName,
                oc.rider_phone AS riderPhone,
                oc.created_at AS createdAt,
                b.plate_number AS bikePlate,
                b.customer_name AS bikeOwner,
                m.name AS mechanicName
            FROM oil_changes oc
            LEFT JOIN bikes b ON oc.bike_id = b.id
            LEFT JOIN mechanics m ON oc.mechanic_id = m.id
            WHERE 1=1
        `;
        const values: any[] = [];

        if (params.bikeId) {
            query += ' AND oc.bike_id = ?';
            values.push(params.bikeId);
        }

        if (params.mechanicId) {
            query += ' AND oc.mechanic_id = ?';
            values.push(params.mechanicId);
        }

        if (params.fromDate) {
            query += ' AND oc.change_date >= ?';
            values.push(this.toMySQLDateTime(params.fromDate));
        }

        if (params.toDate) {
            query += ' AND oc.change_date <= ?';
            values.push(this.toMySQLDateTime(params.toDate));
        }

        query += ' ORDER BY oc.change_date DESC';

        const limit = Math.min(Math.max(0, parseInt(params.limit, 10) || 0), 500);
        if (limit > 0) query += ' LIMIT ' + limit;

        const [rows] = await pool.execute(query, values);
        return rows;
    }

    static async create(data: any) {
        const id = crypto.randomUUID();
        const changeDate = this.toMySQLDateTime(data.changeDate || data.date);

        await pool.execute(
            `INSERT INTO oil_changes 
                (id, bike_id, mechanic_id, change_date, oil_type, mileage, rider_name, rider_phone) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                data.bikeId,
                data.mechanicId || null,
                changeDate,
                data.oilType,
                data.mileage,
                data.riderName || null,
                data.riderPhone || null
            ]
        );

        const [rows]: any = await pool.execute(
            `
            SELECT 
                oc.id,
                oc.bike_id AS bikeId,
                oc.mechanic_id AS mechanicId,
                oc.change_date AS changeDate,
                oc.oil_type AS oilType,
                oc.mileage,
                oc.rider_name AS riderName,
                oc.rider_phone AS riderPhone,
                oc.created_at AS createdAt,
                b.plate_number AS bikePlate,
                b.customer_name AS bikeOwner,
                m.name AS mechanicName
            FROM oil_changes oc
            LEFT JOIN bikes b ON oc.bike_id = b.id
            LEFT JOIN mechanics m ON oc.mechanic_id = m.id
            WHERE oc.id = ?
            `,
            [id]
        );

        return rows[0];
    }
}

