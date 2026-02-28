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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.pool = void 0;
exports.testConnection = testConnection;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbConfig = {
    host: ((_a = process.env.DB_HOST) === null || _a === void 0 ? void 0 : _a.split(':')[0]) || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
exports.pool = promise_1.default.createPool(dbConfig);
// Compatibility wrapper as a separate export if needed, 
// but we'll export the pool directly and use standard promise-based API.
exports.db = {
    prepare: (sql) => {
        // Mocking the SQLite 'prepare' pattern for minimal changes elsewhere
        return {
            run: (...params) => __awaiter(void 0, void 0, void 0, function* () {
                const [result] = yield exports.pool.execute(sql, params);
                return result;
            }),
            get: (...params) => __awaiter(void 0, void 0, void 0, function* () {
                const [rows] = yield exports.pool.execute(sql, params);
                return rows[0];
            }),
            all: (...params) => __awaiter(void 0, void 0, void 0, function* () {
                const [rows] = yield exports.pool.execute(sql, params);
                return rows;
            })
        };
    },
    transaction: (fn) => {
        return (...args) => __awaiter(void 0, void 0, void 0, function* () {
            const connection = yield exports.pool.getConnection();
            try {
                yield connection.beginTransaction();
                const result = yield fn(connection, ...args);
                yield connection.commit();
                return result;
            }
            catch (error) {
                yield connection.rollback();
                throw error;
            }
            finally {
                connection.release();
            }
        });
    },
    exec: (sql) => __awaiter(void 0, void 0, void 0, function* () {
        // MySQL doesn't have a single .exec for multi-statement strings easily with pool.execute
        // We'll split by ; for basic migrations if needed, but better to use connection.query
        const connection = yield exports.pool.getConnection();
        try {
            yield connection.query(sql);
        }
        finally {
            connection.release();
        }
    })
};
function testConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const connection = yield exports.pool.getConnection();
            console.log('[database]: MySQL connected successfully to', process.env.DB_NAME);
            connection.release();
            return true;
        }
        catch (error) {
            console.error('[database]: MySQL connection failed:', error);
            return false;
        }
    });
}
