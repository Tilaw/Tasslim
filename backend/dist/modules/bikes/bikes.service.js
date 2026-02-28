"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BikeService = void 0;
const db_js_1 = require("../../database/db.js");
const crypto_1 = __importDefault(require("crypto"));
class BikeService {
    static getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_js_1.pool.execute(`
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
        });
    }
    static getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_js_1.pool.execute(`
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
        });
    }
    static create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = crypto_1.default.randomUUID();
            yield db_js_1.pool.execute('INSERT INTO bikes (id, plate_number, plate_category, kind, color, ownership, registration_renew_date, registration_expiry, insurance_expiry, accident_details, customer_name, customer_phone, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
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
            return Object.assign({ id }, data);
        });
    }
    static update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
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
            yield db_js_1.pool.execute(`UPDATE bikes SET ${fields.join(', ')} WHERE id = ?`, values);
            return this.getById(id);
        });
    }
    static delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_js_1.pool.execute('UPDATE bikes SET is_active = FALSE WHERE id = ?', [id]);
            return { id, deleted: true };
        });
    }
}
exports.BikeService = BikeService;
