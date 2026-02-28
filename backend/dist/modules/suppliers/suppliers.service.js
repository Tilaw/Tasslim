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
exports.SupplierService = void 0;
const db_js_1 = require("../../database/db.js");
const crypto_1 = __importDefault(require("crypto"));
class SupplierService {
    static getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_js_1.pool.execute('SELECT * FROM suppliers WHERE is_active = TRUE ORDER BY name ASC');
            return rows;
        });
    }
    static getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_js_1.pool.execute('SELECT * FROM suppliers WHERE id = ?', [id]);
            return rows[0];
        });
    }
    static create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = crypto_1.default.randomUUID();
            yield db_js_1.pool.execute('INSERT INTO suppliers (id, name, contact, email, phone, address) VALUES (?, ?, ?, ?, ?, ?)', [id, data.name, data.contact || null, data.email || null, data.phone || null, data.address || null]);
            return Object.assign({ id }, data);
        });
    }
    static update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = [];
            const values = [];
            const fieldMap = {
                contactPerson: 'contact',
                contact: 'contact'
            };
            Object.keys(data).forEach((key) => {
                const dbKey = fieldMap[key] || key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                fields.push(`${dbKey} = ?`);
                values.push(data[key]);
            });
            if (fields.length === 0)
                return this.getById(id);
            values.push(id);
            yield db_js_1.pool.execute(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`, values);
            return this.getById(id);
        });
    }
    static delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_js_1.pool.execute('UPDATE suppliers SET is_active = FALSE WHERE id = ?', [id]);
            return { id, deleted: true };
        });
    }
}
exports.SupplierService = SupplierService;
