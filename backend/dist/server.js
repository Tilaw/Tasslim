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
const app_js_1 = __importDefault(require("./app.js"));
const db_js_1 = require("./database/db.js");
const migrations_js_1 = require("./database/migrations.js");
const PORT = process.env.PORT || 4000;
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('[server]: Starting server...');
            // Run database migrations
            yield (0, migrations_js_1.migrate)();
            // Test database connection
            const dbConnected = yield (0, db_js_1.testConnection)();
            if (!dbConnected) {
                console.warn('[server]: Database connection failed, but starting server anyway...');
            }
            const server = app_js_1.default.listen(PORT, () => {
                console.log(`[server]: Server is running and accessible on the network at port ${PORT}`);
                console.log(`[server]: Local access: http://localhost:${PORT}`);
            });
            server.on('error', (err) => {
                console.error('[server]: Server error:', err);
            });
        }
        catch (error) {
            console.error('[server]: Failed to start server:', error);
        }
    });
}
startServer();
