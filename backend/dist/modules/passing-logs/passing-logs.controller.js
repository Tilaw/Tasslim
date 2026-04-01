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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassingLogsController = void 0;
const passing_logs_service_js_1 = require("./passing-logs.service.js");
class PassingLogsController {
    static listDubai(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield passing_logs_service_js_1.PassingLogsService.listDubaiEntries(req.query.limit);
                res.json({ success: true, data });
            }
            catch (e) {
                next(e);
            }
        });
    }
    static createDubai(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const entries = (_a = req.body) === null || _a === void 0 ? void 0 : _a.entries;
                if (!Array.isArray(entries) || entries.length === 0) {
                    return res.status(400).json({ success: false, error: { message: 'entries array required' } });
                }
                if (entries.length > 50) {
                    return res.status(400).json({ success: false, error: { message: 'Maximum 50 lines per submit' } });
                }
                const normalized = entries.map((e) => ({
                    bikeNumber: String(e.bikeNumber || '').trim(),
                    partName: String(e.partName || '').trim(),
                    quantity: e.quantity
                }));
                for (const row of normalized) {
                    if (!row.bikeNumber || !row.partName) {
                        return res.status(400).json({ success: false, error: { message: 'Each row needs bike number and part name' } });
                    }
                }
                const data = yield passing_logs_service_js_1.PassingLogsService.createDubaiEntries(normalized);
                res.status(201).json({ success: true, data });
            }
            catch (e) {
                next(e);
            }
        });
    }
    static listRiderMovements(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield passing_logs_service_js_1.PassingLogsService.listRiderMovements(req.query.limit);
                res.json({ success: true, data });
            }
            catch (e) {
                next(e);
            }
        });
    }
    static createRiderMovement(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const b = req.body;
                const bikeNumber = String(b.bikeNumber || '').trim();
                const date = String(b.date || '').trim();
                const direction = String(b.direction || '').trim();
                if (!bikeNumber || !date) {
                    return res.status(400).json({ success: false, error: { message: 'bikeNumber and date are required' } });
                }
                if (!direction || !['IN', 'OUT'].includes(direction.toUpperCase())) {
                    return res.status(400).json({ success: false, error: { message: 'direction must be IN or OUT' } });
                }
                const data = yield passing_logs_service_js_1.PassingLogsService.createRiderMovement({
                    bikeNumber,
                    phone: b.phone,
                    riderName: b.riderName,
                    riderId: b.riderId,
                    city: b.city,
                    company: b.company,
                    date,
                    time: b.time,
                    direction
                });
                res.status(201).json({ success: true, data });
            }
            catch (e) {
                next(e);
            }
        });
    }
}
exports.PassingLogsController = PassingLogsController;
