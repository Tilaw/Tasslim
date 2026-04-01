import { pool } from '../../database/db.js';
import crypto from 'crypto';

export class PassingLogsService {
    static async createDubaiEntries(entries: { bikeNumber: string; partName: string; quantity?: number }[]) {
        const created: any[] = [];
        for (const row of entries) {
            const id = crypto.randomUUID();
            const qty = Math.max(1, parseInt(String(row.quantity || 1), 10) || 1);
            await pool.execute(
                `INSERT INTO dubai_manual_part_entries (id, bike_number, part_name, quantity) VALUES (?, ?, ?, ?)`,
                [id, row.bikeNumber.trim(), row.partName.trim(), qty]
            );
            created.push({ id, bikeNumber: row.bikeNumber.trim(), partName: row.partName.trim(), quantity: qty });
        }
        return created;
    }

    static async listDubaiEntries(limitParam: string | undefined) {
        const limit = Math.min(Math.max(0, parseInt(limitParam || '50', 10) || 50), 500);
        const [rows] = await pool.execute(
            `SELECT id, bike_number AS bikeNumber, part_name AS partName, quantity, created_at AS createdAt
             FROM dubai_manual_part_entries ORDER BY created_at DESC LIMIT ` + limit
        );
        return rows;
    }

    static async createRiderMovement(data: {
        bikeNumber: string;
        phone?: string | null;
        riderName?: string | null;
        riderId?: string | null;
        city?: string | null;
        company?: string | null;
        date: string;
        time?: string | null;
        direction: string;
    }) {
        const id = crypto.randomUUID();
        const dir = (data.direction || '').toUpperCase() === 'OUT' ? 'OUT' : 'IN';
        const movementDate = data.date.slice(0, 10);

        await pool.execute(
            `INSERT INTO rider_bike_movements 
                (id, bike_number, phone, rider_name, rider_id, city, company, movement_date, movement_time, direction)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                data.bikeNumber.trim(),
                data.phone?.trim() || null,
                data.riderName?.trim() || null,
                data.riderId?.trim() || null,
                data.city?.trim() || null,
                data.company?.trim() || null,
                movementDate,
                data.time?.trim() || null,
                dir
            ]
        );

        const [rows]: any = await pool.execute(
            `SELECT id, bike_number AS bikeNumber, phone, rider_name AS riderName, rider_id AS riderId,
                    city, company, movement_date AS movementDate, movement_time AS movementTime,
                    direction, created_at AS createdAt
             FROM rider_bike_movements WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

    static async listRiderMovements(limitParam: string | undefined) {
        const limit = Math.min(Math.max(0, parseInt(limitParam || '100', 10) || 100), 500);
        const [rows] = await pool.execute(
            `SELECT id, bike_number AS bikeNumber, phone, rider_name AS riderName, rider_id AS riderId,
                    city, company, movement_date AS movementDate, movement_time AS movementTime,
                    direction, created_at AS createdAt
             FROM rider_bike_movements ORDER BY created_at DESC LIMIT ` + limit
        );
        return rows;
    }
}
