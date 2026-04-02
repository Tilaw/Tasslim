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
exports.migrate = migrate;
const db_js_1 = require("./db.js");
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
function migrate() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('[database]: Starting MySQL migrations...');
        const schema = `
        -- Roles
        CREATE TABLE IF NOT EXISTS roles (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Permissions
        CREATE TABLE IF NOT EXISTS permissions (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            resource VARCHAR(100) NOT NULL,
            action VARCHAR(50) NOT NULL,
            description TEXT
        );

        -- Role Permissions
        CREATE TABLE IF NOT EXISTS role_permissions (
            role_id VARCHAR(36),
            permission_id VARCHAR(36),
            PRIMARY KEY (role_id, permission_id),
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
            FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
        );

        -- Users
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(36) PRIMARY KEY,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            phone VARCHAR(20),
            role_id VARCHAR(36),
            is_active TINYINT(1) DEFAULT 1,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
        );

        -- Categories
        CREATE TABLE IF NOT EXISTS categories (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            parent_category_id VARCHAR(36) NULL,
            description TEXT,
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE SET NULL
        );

        -- Products
        CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(36) PRIMARY KEY,
            sku VARCHAR(100) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category_id VARCHAR(36),
            brand VARCHAR(100),
            model VARCHAR(100),
            unit_of_measure VARCHAR(50) DEFAULT 'piece',
            reorder_level INT DEFAULT 0,
            unit_cost DECIMAL(15, 2) DEFAULT 0.00,
            unit_price DECIMAL(15, 2) DEFAULT 0.00,
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        );

        -- Inventory
        CREATE TABLE IF NOT EXISTS inventory (
            id VARCHAR(36) PRIMARY KEY,
            product_id VARCHAR(36) NOT NULL UNIQUE,
            quantity INT NOT NULL DEFAULT 0,
            reserved_quantity INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );

        -- Suppliers
        CREATE TABLE IF NOT EXISTS suppliers (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            contact VARCHAR(100),
            email VARCHAR(100),
            phone VARCHAR(20),
            address TEXT,
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        -- Mechanics
        CREATE TABLE IF NOT EXISTS mechanics (
            id VARCHAR(36) PRIMARY KEY,
            code VARCHAR(50),
            unique_code VARCHAR(100) UNIQUE,
            name VARCHAR(100) UNIQUE NOT NULL,
            passport_number VARCHAR(100),
            phone VARCHAR(20),
            specialization VARCHAR(100),
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        -- Bikes
        CREATE TABLE IF NOT EXISTS bikes (
            id VARCHAR(36) PRIMARY KEY,
            plate_number VARCHAR(50) UNIQUE NOT NULL,
            plate_category VARCHAR(50),
            kind VARCHAR(50),
            color VARCHAR(50),
            ownership VARCHAR(100),
            registration_renew_date VARCHAR(50),
            registration_expiry VARCHAR(50),
            insurance_expiry VARCHAR(50),
            accident_details TEXT,
            customer_name VARCHAR(100),
            customer_phone VARCHAR(20),
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        -- Inventory Transactions (Sales/Issues)
        CREATE TABLE IF NOT EXISTS inventory_transactions (
            id VARCHAR(36) PRIMARY KEY,
            product_id VARCHAR(36) NOT NULL,
            transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'sale', 'return', 'adjustment'
            quantity INT NOT NULL,
            mechanic_id VARCHAR(36) NULL,
            bike_id VARCHAR(36) NULL,
            reference_id VARCHAR(100),
            notes TEXT,
            unit_price DECIMAL(15,2) NULL,
            created_by VARCHAR(36),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (mechanic_id) REFERENCES mechanics(id) ON DELETE SET NULL,
            FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE SET NULL
        );

        -- Oil Change Records
        CREATE TABLE IF NOT EXISTS oil_changes (
            id VARCHAR(36) PRIMARY KEY,
            bike_id VARCHAR(36) NOT NULL,
            mechanic_id VARCHAR(36) NULL,
            change_date DATETIME NOT NULL,
            oil_type VARCHAR(100) NOT NULL,
            mileage INT NOT NULL,
            rider_name VARCHAR(100),
            rider_phone VARCHAR(50),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE CASCADE,
            FOREIGN KEY (mechanic_id) REFERENCES mechanics(id) ON DELETE SET NULL
        );

        -- Riders (master data: name, phone, mapped bike plates)
        CREATE TABLE IF NOT EXISTS riders (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            plates TEXT,
            imported TINYINT(1) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        -- Dubai manual bike part lines (bikes not in system — log only, no inventory link)
        CREATE TABLE IF NOT EXISTS dubai_manual_part_entries (
            id VARCHAR(36) PRIMARY KEY,
            bike_number VARCHAR(100) NOT NULL,
            part_name VARCHAR(255) NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Rider check-in / check-out log at gate
        CREATE TABLE IF NOT EXISTS rider_bike_movements (
            id VARCHAR(36) PRIMARY KEY,
            bike_number VARCHAR(100) NOT NULL,
            phone VARCHAR(50),
            rider_name VARCHAR(150),
            rider_id VARCHAR(100),
            city VARCHAR(100),
            company VARCHAR(150),
            movement_date DATE NOT NULL,
            movement_time VARCHAR(32),
            direction VARCHAR(10) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Refresh Tokens
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id VARCHAR(36) NOT NULL,
            token VARCHAR(767) NOT NULL UNIQUE,  -- Max length for unique index in some MySQL distros
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `;
        try {
            // Execute schema one statement at a time for better reliability in pool.query
            const statements = schema.split(';').filter(s => s.trim().length > 0);
            for (const s of statements) {
                yield db_js_1.pool.query(s);
            }
            console.log('[database]: Tables verified/created');
            // Helper to check if a column exists
            const columnExists = (tableName, columnName) => __awaiter(this, void 0, void 0, function* () {
                const [rows] = yield db_js_1.pool.query('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?', [process.env.DB_NAME, tableName, columnName]);
                return rows.length > 0;
            });
            // Check for missing columns in bikes table
            const bikeCols = [
                { name: 'plate_category', type: 'VARCHAR(50)' },
                { name: 'color', type: 'VARCHAR(50)' },
                { name: 'ownership', type: 'VARCHAR(100)' },
                { name: 'registration_expiry', type: 'VARCHAR(50)' },
                { name: 'insurance_expiry', type: 'VARCHAR(50)' },
                { name: 'accident_details', type: 'TEXT' },
                { name: 'kind', type: 'VARCHAR(50)' },
                { name: 'registration_renew_date', type: 'VARCHAR(50)' },
                { name: 'location', type: 'TEXT' }
            ];
            for (const col of bikeCols) {
                if (!(yield columnExists('bikes', col.name))) {
                    console.log(`[database]: Adding missing column ${col.name} to bikes table...`);
                    yield db_js_1.pool.query(`ALTER TABLE bikes ADD COLUMN ${col.name} ${col.type}`);
                }
            }
            // Ensure inventory_transactions.transaction_type accepts 'issue' (ENUM may only have purchase,sale,return,adjustment)
            const [txCol] = yield db_js_1.pool.query(`SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'inventory_transactions' AND COLUMN_NAME = 'transaction_type'`, [process.env.DB_NAME]);
            if (txCol && txCol[0] && typeof txCol[0].COLUMN_TYPE === 'string' && txCol[0].COLUMN_TYPE.toLowerCase().includes('enum') && !txCol[0].COLUMN_TYPE.toLowerCase().includes('issue')) {
                console.log('[database]: Altering inventory_transactions.transaction_type to VARCHAR(50) to support "issue"...');
                yield db_js_1.pool.query('ALTER TABLE inventory_transactions MODIFY COLUMN transaction_type VARCHAR(50) NOT NULL');
            }
            // Ensure rider / receiver tracking columns exist on inventory_transactions
            const txExtraCols = [
                { name: 'rider_name', type: 'VARCHAR(100)' },
                { name: 'rider_phone', type: 'VARCHAR(50)' },
                { name: 'rider_id', type: 'VARCHAR(100)' },
                { name: 'receiver_name', type: 'VARCHAR(100)' },
                { name: 'is_reverted', type: 'TINYINT(1) DEFAULT 0' },
                { name: 'unit_price', type: 'DECIMAL(15,2) NULL' }
            ];
            for (const col of txExtraCols) {
                if (!(yield columnExists('inventory_transactions', col.name))) {
                    console.log(`[database]: Adding missing column ${col.name} to inventory_transactions table...`);
                    yield db_js_1.pool.query(`ALTER TABLE inventory_transactions ADD COLUMN ${col.name} ${col.type}`);
                }
            }
            // Allow same reference_id for multiple transaction lines (one issuance = one reference, multiple parts)
            try {
                const [idx] = yield db_js_1.pool.query(`SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'inventory_transactions' AND COLUMN_NAME = 'reference_id' AND NON_UNIQUE = 0`, [process.env.DB_NAME]);
                if (idx && idx.length > 0) {
                    console.log('[database]: Dropping UNIQUE on inventory_transactions.reference_id...');
                    yield db_js_1.pool.query('ALTER TABLE inventory_transactions DROP INDEX reference_id');
                }
            }
            catch (e) {
                // Index might not exist or have different name; ignore
            }
            // Ensure Default Roles exist
            const [existingRoles] = yield db_js_1.pool.query("SELECT name, id FROM roles");
            const roleMap = new Map(existingRoles.map((r) => [r.name, r.id]));
            const defaultRoles = [
                ['super_admin', 'Full system access'],
                ['admin', 'Standard administrative access'],
                ['store_manager', 'Manage store operations'],
                ['inventory_manager', 'Manage inventory and suppliers'],
                ['sales_person', 'Process sales and view inventory'],
                ['accountant', 'Financial reports'],
                ['viewer', 'Read-only access'],
                ['staff', 'Shop staff - restricted access']
            ];
            for (const [name, desc] of defaultRoles) {
                if (!roleMap.has(name)) {
                    const id = crypto_1.default.randomUUID();
                    console.log(`[database]: Seeding role: ${name}`);
                    yield db_js_1.pool.query('INSERT INTO roles (id, name, description) VALUES (?, ?, ?)', [id, name, desc]);
                    roleMap.set(name, id);
                }
            }
            const adminRoleId = roleMap.get('admin');
            const staffRoleId = roleMap.get('staff');
            // Ensure Production Admin User exists (and is set to 'admin' role, not 'super_admin')
            const adminEmail = 'admin@taslimalwataniah.ae';
            const adminHash = '$2b$10$nVteAPrhZ/OsH3xsrloc.uy6RXD1agZE/WIUuP3U/MVBcd0lNuAd.'; // Password: taslima!@#$%
            const [existingAdmins] = yield db_js_1.pool.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
            if (existingAdmins.length === 0) {
                console.log(`[database]: Creating production admin user: ${adminEmail}`);
                yield db_js_1.pool.query('INSERT INTO users (id, email, password_hash, first_name, last_name, role_id) VALUES (?, ?, ?, ?, ?, ?)', [crypto_1.default.randomUUID(), adminEmail, adminHash, 'System', 'Admin', adminRoleId]);
            }
            else {
                console.log(`[database]: Updating production admin role to 'admin': ${adminEmail}`);
                yield db_js_1.pool.query('UPDATE users SET role_id = ?, is_active = 1 WHERE email = ?', [adminRoleId, adminEmail]);
            }
            // Seed Demo Users (admin/admin and staff/staff)
            const demoUsers = [
                { email: 'admin', pass: 'admin', first: 'Demo', last: 'Admin', role: adminRoleId },
                { email: 'staff', pass: 'staff', first: 'Demo', last: 'Staff', role: staffRoleId }
            ];
            for (const user of demoUsers) {
                const [existing] = yield db_js_1.pool.query('SELECT id FROM users WHERE email = ?', [user.email]);
                const hash = yield bcryptjs_1.default.hash(user.pass, 10);
                if (existing.length === 0) {
                    console.log(`[database]: Seeding demo user: ${user.email}`);
                    yield db_js_1.pool.query('INSERT INTO users (id, email, password_hash, first_name, last_name, role_id) VALUES (?, ?, ?, ?, ?, ?)', [crypto_1.default.randomUUID(), user.email, hash, user.first, user.last, user.role]);
                }
                else {
                    // Update to ensure demo passwords stay as expected for verification
                    yield db_js_1.pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, user.email]);
                }
            }
            console.log('[database]: Migrations completed successfully');
        }
        catch (error) {
            console.error('[database]: Migration failed:', error);
            throw error;
        }
    });
}
