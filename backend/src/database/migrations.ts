import { pool } from './db.js';
import crypto from 'crypto';

export async function migrate() {
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
            reference_id VARCHAR(100) UNIQUE,
            notes TEXT,
            created_by VARCHAR(36),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (mechanic_id) REFERENCES mechanics(id) ON DELETE SET NULL,
            FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE SET NULL
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
            await pool.query(s);
        }
        console.log('[database]: Tables verified/created');

        // Helper to check if a column exists
        const columnExists = async (tableName: string, columnName: string) => {
            const [rows] = await pool.query(
                'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
                [process.env.DB_NAME, tableName, columnName]
            );
            return (rows as any[]).length > 0;
        };

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
            if (!(await columnExists('bikes', col.name))) {
                console.log(`[database]: Adding missing column ${col.name} to bikes table...`);
                await pool.query(`ALTER TABLE bikes ADD COLUMN ${col.name} ${col.type}`);
            }
        }

        // Seed default roles if empty
        const [roles] = await pool.query('SELECT COUNT(*) as count FROM roles');
        if ((roles as any[])[0].count === 0) {
            console.log('[database]: Seeding default roles...');
            const defaultRoles = [
                [crypto.randomUUID(), 'super_admin', 'Full system access'],
                [crypto.randomUUID(), 'store_manager', 'Manage store operations'],
                [crypto.randomUUID(), 'inventory_manager', 'Manage inventory and suppliers'],
                [crypto.randomUUID(), 'sales_person', 'Process sales and view inventory'],
                [crypto.randomUUID(), 'accountant', 'Financial reports'],
                [crypto.randomUUID(), 'viewer', 'Read-only access'],
                [crypto.randomUUID(), 'staff', 'Shop staff - restricted access']
            ];
            for (const role of defaultRoles) {
                await pool.query('INSERT INTO roles (id, name, description) VALUES (?, ?, ?)', role);
            }
        }

        const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
        if ((users as any[])[0].count === 0) {
            console.log('[database]: Seeding default admin user...');
            const [adminRoles] = await pool.query("SELECT id FROM roles WHERE name = 'super_admin'");
            if ((adminRoles as any[]).length > 0) {
                const adminRole = (adminRoles as any[])[0];
                const adminHash = '$2b$10$Xv4la7dWjWVgir8OLzqQYZ63dte.6vS3nwc.KT7L';
                await pool.query(
                    'INSERT INTO users (id, email, password_hash, first_name, last_name, role_id) VALUES (?, ?, ?, ?, ?, ?)',
                    [crypto.randomUUID(), 'admin', adminHash, 'Admin', 'User', adminRole.id]
                );
            }
        }

        console.log('[database]: Migrations completed successfully');
    } catch (error) {
        console.error('[database]: Migration failed:', error);
        throw error;
    }
}
