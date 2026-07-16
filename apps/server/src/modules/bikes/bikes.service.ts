import { pool } from '../../database/db.js';
import crypto from 'crypto';

export class BikeService {
    static async getAll() {
        const [rows] = await pool.execute(`
            SELECT 
                id,
                plate_number AS \`plate\`,
                plate_category AS \`category\`,
                kind,
                color,
                ownership,
                registration_renew_date AS \`regRenew\`,
                registration_expiry AS \`regExp\`,
                insurance_expiry AS \`insExp\`,
                accident_details AS \`accident\`,
                customer_name AS \`customer\`,
                customer_phone AS \`phone\`,
                location,
                is_active
            FROM bikes 
            WHERE is_active = TRUE 
            ORDER BY plate_number ASC
        `);
        return rows;
    }

    static async getById(id: string) {
        const [rows]: any = await pool.execute(`
            SELECT 
                id,
                plate_number AS \`plate\`,
                plate_category AS \`category\`,
                kind,
                color,
                ownership,
                registration_renew_date AS \`regRenew\`,
                registration_expiry AS \`regExp\`,
                insurance_expiry AS \`insExp\`,
                accident_details AS \`accident\`,
                customer_name AS \`customer\`,
                customer_phone AS \`phone\`,
                location,
                is_active
            FROM bikes 
            WHERE id = ?
        `, [id]);
        return rows[0];
    }

    static async create(data: any) {
        const id = crypto.randomUUID();
        await pool.execute(
            'INSERT INTO bikes (id, plate_number, plate_category, kind, color, ownership, registration_renew_date, registration_expiry, insurance_expiry, accident_details, customer_name, customer_phone, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
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
            ]
        );
        return { id, ...data };
    }

    static async update(id: string, data: any) {
        const fields: string[] = [];
        const values: any[] = [];

        const fieldMap: Record<string, string> = {
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
            if (dbKey === 'id' || dbKey === 'is_active') return;
            fields.push(`${dbKey} = ?`);
            values.push(data[key]);
        });
        if (fields.length === 0) return this.getById(id);
        values.push(id);
        await pool.execute(`UPDATE bikes SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.getById(id);
    }

    static async getReportHistory(id: string) {
        // 1. Get Bike Info
        const bike = await this.getById(id);
        if (!bike) {
            return null;
        }

        const plate = bike.plate;

        // 2. Fetch associated riders from riders table
        const [ridersTableRows]: any = await pool.execute(
            `SELECT id, name, phone, plates, imported, created_at, updated_at 
             FROM riders WHERE plates LIKE ?`,
            [`%${plate}%`]
        );

        // Fetch riders from oil changes
        const [oilChangesRiders]: any = await pool.execute(
            `SELECT DISTINCT rider_name AS name, rider_phone AS phone 
             FROM oil_changes 
             WHERE bike_id = ?`,
            [id]
        );

        // Fetch riders from inventory transactions
        const [txRiders]: any = await pool.execute(
            `SELECT DISTINCT rider_name AS name, rider_phone AS phone, rider_id AS id 
             FROM inventory_transactions 
             WHERE bike_id = ?`,
            [id]
        );

        // Fetch riders from bike movements
        const [movementRiders]: any = await pool.execute(
            `SELECT DISTINCT rider_name AS name, phone AS phone, rider_id AS id 
             FROM rider_bike_movements 
             WHERE bike_number = ?`,
            [plate]
        );

        // Consolidate riders list uniquely by (name, phone)
        const ridersMap = new Map<string, any>();

        // Populate standard riders first
        for (const r of ridersTableRows) {
            const key = `${(r.name || '').toLowerCase().trim()}_${(r.phone || '').toLowerCase().trim()}`;
            ridersMap.set(key, { source: 'Master List', id: r.id, name: r.name, phone: r.phone, plates: r.plates });
        }

        // Add others if they don't exist
        const allTempRiders = [...oilChangesRiders, ...txRiders, ...movementRiders];
        for (const r of allTempRiders) {
            if (!r.name && !r.phone) continue;
            const key = `${(r.name || '').toLowerCase().trim()}_${(r.phone || '').toLowerCase().trim()}`;
            if (!ridersMap.has(key)) {
                ridersMap.set(key, { source: 'Transaction logs', id: r.id || '', name: r.name || '', phone: r.phone || '', plates: plate });
            }
        }
        const consolidatedRiders = Array.from(ridersMap.values());

        // 3. Fetch mechanics from actions
        const [txMechanics]: any = await pool.execute(
            `SELECT DISTINCT m.id, m.name, m.phone, m.specialization 
             FROM inventory_transactions t 
             JOIN mechanics m ON t.mechanic_id = m.id 
             WHERE t.bike_id = ?`,
            [id]
        );

        const [oilMechanics]: any = await pool.execute(
            `SELECT DISTINCT m.id, m.name, m.phone, m.specialization 
             FROM oil_changes o 
             JOIN mechanics m ON o.mechanic_id = m.id 
             WHERE o.bike_id = ?`,
            [id]
        );

        const mechanicsMap = new Map<string, any>();
        for (const m of [...txMechanics, ...oilMechanics]) {
            mechanicsMap.set(m.id, m);
        }
        const consolidatedMechanics = Array.from(mechanicsMap.values());

        // 4. Maintenance transactions
        const [transactions]: any = await pool.execute(
            `SELECT 
                 t.id, t.reference_id AS referenceId, t.transaction_type AS transactionType, 
                 t.quantity, t.notes, t.unit_price AS unitPrice, t.created_at AS createdAt,
                 p.name AS productName, p.sku AS productSku, p.brand AS productBrand, p.model AS productModel,
                 m.name AS mechanicName, m.phone AS mechanicPhone,
                 t.rider_name AS riderName, t.rider_phone AS riderPhone, t.receiver_name AS receiverName
             FROM inventory_transactions t
             LEFT JOIN products p ON t.product_id = p.id
             LEFT JOIN mechanics m ON t.mechanic_id = m.id
             WHERE t.bike_id = ? AND (t.is_reverted IS NULL OR t.is_reverted = 0)
             ORDER BY t.created_at DESC`,
            [id]
        );

        // 5. Oil changes
        const [oilChanges]: any = await pool.execute(
            `SELECT 
                 o.id, o.change_date AS changeDate, o.oil_type AS oilType, o.mileage, 
                 o.rider_name AS riderName, o.rider_phone AS riderPhone, o.created_at AS createdAt,
                 m.name AS mechanicName, m.phone AS mechanicPhone
             FROM oil_changes o
             LEFT JOIN mechanics m ON o.mechanic_id = m.id
             WHERE o.bike_id = ?
             ORDER BY o.change_date DESC`,
            [id]
        );

        // 6. Movements
        const [movements]: any = await pool.execute(
            `SELECT 
                 id, rider_name AS riderName, phone AS riderPhone, rider_id AS riderId, 
                 city, company, movement_date AS movementDate, movement_time AS movementTime, 
                 direction, created_at AS createdAt
             FROM rider_bike_movements
             WHERE bike_number = ?
             ORDER BY movement_date DESC, movement_time DESC`,
            [plate]
        );

        return {
            bike,
            riders: consolidatedRiders,
            mechanics: consolidatedMechanics,
            transactions,
            oilChanges,
            movements
        };
    }

    static async delete(id: string) {
        await pool.execute('UPDATE bikes SET is_active = FALSE WHERE id = ?', [id]);
        return { id, deleted: true };
    }
}
