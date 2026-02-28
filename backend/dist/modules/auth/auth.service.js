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
exports.AuthService = void 0;
const db_js_1 = require("../../database/db.js");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
class AuthService {
    static login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            // Allow login by exact email match OR by the 'email' column value directly (supports username-style logins like 'admin')
            const [rows] = yield db_js_1.pool.execute(`SELECT u.*, r.name as role FROM users u 
             LEFT JOIN roles r ON u.role_id = r.id 
             WHERE u.email = ? OR u.email LIKE ?`, [email, `${email}@%`]);
            const user = rows[0];
            if (!user || !(yield bcryptjs_1.default.compare(password, user.password_hash))) {
                throw new Error('Invalid credentials');
            }
            if (!user.is_active) {
                throw new Error('Account is deactivated');
            }
            const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') });
            const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') });
            // Save refresh token to db
            yield db_js_1.pool.execute("INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))", [user.id, refreshToken]);
            return {
                token,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                },
            };
        });
    }
    static register(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const passwordHash = yield bcryptjs_1.default.hash(userData.password, 10);
            const userId = crypto_1.default.randomUUID();
            let roleId = userData.roleId;
            // Map role name to role ID if name is provided (for frontend legacy compatibility)
            if (!roleId && userData.role) {
                const [roleRows] = yield db_js_1.pool.execute("SELECT id FROM roles WHERE name = ? OR name = ?", [userData.role, userData.role === 'admin' ? 'super_admin' : userData.role]);
                if (roleRows[0])
                    roleId = roleRows[0].id;
            }
            yield db_js_1.pool.execute('INSERT INTO users (id, email, password_hash, first_name, last_name, role_id) VALUES (?, ?, ?, ?, ?, ?)', [
                userId,
                userData.email,
                passwordHash,
                userData.firstName || ((_a = userData.name) === null || _a === void 0 ? void 0 : _a.split(' ')[0]) || 'User',
                userData.lastName || ((_b = userData.name) === null || _b === void 0 ? void 0 : _b.split(' ').slice(1).join(' ')) || '',
                roleId || null,
            ]);
            return { id: userId, email: userData.email };
        });
    }
    static getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_js_1.pool.execute(`SELECT u.id, u.email, u.first_name, u.last_name, r.name as role 
             FROM users u 
             LEFT JOIN roles r ON u.role_id = r.id`);
            return rows.map((u) => ({
                id: u.id,
                name: `${u.first_name} ${u.last_name}`.trim(),
                email: u.email,
                role: u.role === 'super_admin' ? 'admin' : u.role || 'staff'
            }));
        });
    }
    static delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [result] = yield db_js_1.pool.execute('DELETE FROM users WHERE id = ?', [id]);
            return result.affectedRows > 0;
        });
    }
}
exports.AuthService = AuthService;
