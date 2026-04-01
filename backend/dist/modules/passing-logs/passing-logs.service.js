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
exports.PassingLogsService = void 0;
const db_js_1 = require("../../database/db.js");
const crypto_1 = __importDefault(require("crypto"));
class PassingLogsService {
    static createDubaiEntries(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            const created = [];
            for (const row of entries) {
                const id = crypto_1.default.randomUUID();
                const qty = Math.max(1, parseInt(String(row.quantity || 1), 10) || 1);
                yield db_js_1.pool.execute(`INSERT INTO dubai_manual_part_entries (id, bike_number, part_name, quantity) VALUES (?, ?, ?, ?)`, [id, row.bikeNumber.trim(), row.partName.trim(), qty]);
                created.push({ id, bikeNumber: row.bikeNumber.trim(), partName: row.partName.trim(), quantity: qty });
            }
            return created;
        });
    }
    static listDubaiEntries(limitParam) {
        return __awaiter(this, void 0, void 0, function* () {
            const limit = Math.min(Math.max(0, parseInt(limitParam || '50', 10) || 50), 500);
            const [rows] = yield db_js_1.pool.execute(`SELECT id, bike_number AS bikeNumber, part_name AS partName, quantity, created_at AS createdAt
             FROM dubai_manual_part_entries ORDER BY created_at DESC LIMIT ` + limit);
            return rows;
        });
    }
    static createRiderMovement(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            const id = crypto_1.default.randomUUID();
            const dir = (data.direction || '').toUpperCase() === 'OUT' ? 'OUT' : 'IN';
            const movementDate = data.date.slice(0, 10);
            yield db_js_1.pool.execute(`INSERT INTO rider_bike_movements 
                (id, bike_number, phone, rider_name, rider_id, city, company, movement_date, movement_time, direction)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                id,
                data.bikeNumber.trim(),
                ((_a = data.phone) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                ((_b = data.riderName) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                ((_c = data.riderId) === null || _c === void 0 ? void 0 : _c.trim()) || null,
                ((_d = data.city) === null || _d === void 0 ? void 0 : _d.trim()) || null,
                ((_e = data.company) === null || _e === void 0 ? void 0 : _e.trim()) || null,
                movementDate,
                ((_f = data.time) === null || _f === void 0 ? void 0 : _f.trim()) || null,
                dir
            ]);
            const [rows] = yield db_js_1.pool.execute(`SELECT id, bike_number AS bikeNumber, phone, rider_name AS riderName, rider_id AS riderId,
                    city, company, movement_date AS movementDate, movement_time AS movementTime,
                    direction, created_at AS createdAt
             FROM rider_bike_movements WHERE id = ?`, [id]);
            return rows[0];
        });
    }
    static listRiderMovements(limitParam) {
        return __awaiter(this, void 0, void 0, function* () {
            const limit = Math.min(Math.max(0, parseInt(limitParam || '100', 10) || 100), 500);
            const [rows] = yield db_js_1.pool.execute(`SELECT id, bike_number AS bikeNumber, phone, rider_name AS riderName, rider_id AS riderId,
                    city, company, movement_date AS movementDate, movement_time AS movementTime,
                    direction, created_at AS createdAt
             FROM rider_bike_movements ORDER BY created_at DESC LIMIT ` + limit);
            return rows;
        });
    }
}
exports.PassingLogsService = PassingLogsService;
