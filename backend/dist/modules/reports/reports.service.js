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
exports.ReportsService = void 0;
const db_js_1 = require("../../database/db.js");
class ReportsService {
    static getDashboardStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const [productRows] = yield db_js_1.pool.execute('SELECT COUNT(*) as count FROM products');
            const [supplierRows] = yield db_js_1.pool.execute('SELECT COUNT(*) as count FROM suppliers');
            const [lowStockRows] = yield db_js_1.pool.execute(`
            SELECT COUNT(*) as count 
            FROM products p
            JOIN inventory i ON p.id = i.product_id
            WHERE i.quantity <= p.reorder_level
        `);
            const [userRows] = yield db_js_1.pool.execute('SELECT COUNT(*) as count FROM users');
            return {
                totalProducts: productRows[0].count,
                activeSuppliers: supplierRows[0].count,
                lowStockItems: lowStockRows[0].count,
                totalUsers: userRows[0].count
            };
        });
    }
}
exports.ReportsService = ReportsService;
