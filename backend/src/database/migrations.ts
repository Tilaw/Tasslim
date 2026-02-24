import { db } from './db.js';
import crypto from 'crypto';

export async function migrate() {
    console.log('[database]: Starting SQLite migrations...');

    const schema = `
        -- Roles
        CREATE TABLE IF NOT EXISTS roles (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Permissions
        CREATE TABLE IF NOT EXISTS permissions (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            resource TEXT NOT NULL,
            action TEXT NOT NULL,
            description TEXT
        );

        -- Role Permissions
        CREATE TABLE IF NOT EXISTS role_permissions (
            role_id TEXT,
            permission_id TEXT,
            PRIMARY KEY (role_id, permission_id),
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
            FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
        );

        -- Users
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT,
            role_id TEXT,
            is_active INTEGER DEFAULT 1,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
        );

        -- Categories
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            parent_category_id TEXT NULL,
            description TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE SET NULL
        );

        -- Products
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            sku TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            category_id TEXT,
            brand TEXT,
            model TEXT,
            unit_of_measure TEXT DEFAULT 'piece',
            reorder_level INTEGER DEFAULT 0,
            unit_cost REAL DEFAULT 0.00,
            unit_price REAL DEFAULT 0.00,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        );

        -- Inventory
        CREATE TABLE IF NOT EXISTS inventory (
            id TEXT PRIMARY KEY,
            product_id TEXT NOT NULL UNIQUE,
            quantity INTEGER NOT NULL DEFAULT 0,
            reserved_quantity INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );

        -- Suppliers
        CREATE TABLE IF NOT EXISTS suppliers (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            contact TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Mechanics
        CREATE TABLE IF NOT EXISTS mechanics (
            id TEXT PRIMARY KEY,
            code TEXT,
            unique_code TEXT UNIQUE,
            name TEXT UNIQUE NOT NULL,
            passport_number TEXT,
            phone TEXT,
            specialization TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Bikes
        CREATE TABLE IF NOT EXISTS bikes (
            id TEXT PRIMARY KEY,
            plate_number TEXT UNIQUE NOT NULL,
            plate_category TEXT,
            kind TEXT,
            color TEXT,
            ownership TEXT,
            registration_renew_date TEXT,
            registration_expiry TEXT,
            insurance_expiry TEXT,
            accident_details TEXT,
            customer_name TEXT,
            customer_phone TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Inventory Transactions (Sales/Issues)
        CREATE TABLE IF NOT EXISTS inventory_transactions (
            id TEXT PRIMARY KEY,
            product_id TEXT NOT NULL,
            transaction_type TEXT NOT NULL, -- 'purchase', 'sale', 'return', 'adjustment'
            quantity INTEGER NOT NULL,
            mechanic_id TEXT NULL,
            bike_id TEXT NULL,
            reference_id TEXT,
            notes TEXT,
            created_by TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (mechanic_id) REFERENCES mechanics(id) ON DELETE SET NULL,
            FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE SET NULL
        );

        -- Refresh Tokens
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            token TEXT NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `;

    try {
        db.exec(schema);
        console.log('[database]: Tables verified/created');

        // --- Data Deduplication and Unique Index Creation ---
        const dedupeAndIndex = (tableName: string, columnName: string, dependentTableMoves: { table: string, column: string }[]) => {
            const duplicates = db.prepare(`
                SELECT ${columnName}, COUNT(*) as count 
                FROM ${tableName} 
                GROUP BY ${columnName} 
                HAVING count > 1
            `).all() as any[];

            if (duplicates.length > 0) {
                console.log(`[database]: Found duplicates in ${tableName} on ${columnName}. Cleaning up...`);
                for (const dup of duplicates) {
                    const records = db.prepare(`
                        SELECT id FROM ${tableName} 
                        WHERE ${columnName} = ? 
                        ORDER BY created_at ASC
                    `).all(dup[columnName]) as any[];

                    const masterId = records[0].id;
                    const redundantIds = records.slice(1).map(r => r.id);

                    // Update dependent tables
                    for (const dep of dependentTableMoves) {
                        db.prepare(`
                            UPDATE ${dep.table} SET ${dep.column} = ? 
                            WHERE ${dep.column} IN (${redundantIds.map(() => '?').join(',')})
                        `).run(masterId, ...redundantIds);
                    }

                    // Delete redundant records
                    db.prepare(`
                        DELETE FROM ${tableName} 
                        WHERE id IN (${redundantIds.map(() => '?').join(',')})
                    `).run(...redundantIds);
                }
            }

            // Create UNIQUE INDEX to enforce constraints if table already existed without them
            try {
                db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_${tableName}_unique_${columnName} ON ${tableName}(${columnName})`);
            } catch (err) {
                console.warn(`[database]: Could not create unique index on ${tableName}(${columnName}). It might already be restricted.`);
            }
        };

        // Run Deduplication
        dedupeAndIndex('categories', 'name', [
            { table: 'products', column: 'category_id' },
            { table: 'categories', column: 'parent_category_id' }
        ]);
        dedupeAndIndex('suppliers', 'name', []); // Add dependent tables if discovered later
        dedupeAndIndex('mechanics', 'name', [
            { table: 'inventory_transactions', column: 'mechanic_id' }
        ]);

        // Check for missing columns in bikes table (for existing databases)
        const bikesTableInfo = db.prepare("PRAGMA table_info(bikes)").all() as any[];
        const existingColumns = bikesTableInfo.map(c => c.name);

        const requiredColumns = [
            { name: 'plate_category', type: 'TEXT' },
            { name: 'color', type: 'TEXT' },
            { name: 'ownership', type: 'TEXT' },
            { name: 'registration_expiry', type: 'TEXT' },
            { name: 'insurance_expiry', type: 'TEXT' },
            { name: 'accident_details', type: 'TEXT' }
        ];

        for (const col of requiredColumns) {
            if (!existingColumns.includes(col.name)) {
                console.log(`[database]: Adding missing column ${col.name} to bikes table...`);
                db.exec(`ALTER TABLE bikes ADD COLUMN ${col.name} ${col.type}`);
            }
        }

        // Add 'kind', 'registration_renew_date', and 'location' to bikes if missing
        const requiredBikeColumns = [
            { name: 'kind', type: 'TEXT' },
            { name: 'registration_renew_date', type: 'TEXT' },
            { name: 'location', type: 'TEXT' }
        ];

        for (const col of requiredBikeColumns) {
            if (!existingColumns.includes(col.name)) {
                console.log(`[database]: Adding missing column ${col.name} to bikes table...`);
                db.exec(`ALTER TABLE bikes ADD COLUMN ${col.name} ${col.type}`);
            }
        }

        // Check for missing columns in mechanics table
        const mechanicsTableInfo = db.prepare("PRAGMA table_info(mechanics)").all() as any[];
        const existingMechColumns = mechanicsTableInfo.map(c => c.name);

        const requiredMechColumns = [
            { name: 'code', type: 'TEXT' },
            { name: 'unique_code', type: 'TEXT' },
            { name: 'passport_number', type: 'TEXT' }
        ];

        for (const col of requiredMechColumns) {
            if (!existingMechColumns.includes(col.name)) {
                console.log(`[database]: Adding missing column ${col.name} to mechanics table...`);
                db.exec(`ALTER TABLE mechanics ADD COLUMN ${col.name} ${col.type}`);
            }
        }

        // Seed default roles if empty
        const rolesCount = db.prepare('SELECT COUNT(*) as count FROM roles').get() as any;
        if (rolesCount.count === 0) {
            console.log('[database]: Seeding default roles...');
            const insertRole = db.prepare('INSERT INTO roles (id, name, description) VALUES (?, ?, ?)');
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
                insertRole.run(...role);
            }
        }

        const usersCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
        if (usersCount === 0) {
            console.log('[database]: Seeding default admin user...');
            const adminRole = db.prepare("SELECT id FROM roles WHERE name = 'super_admin'").get() as any;
            if (adminRole) {
                const insertUser = db.prepare(`
                    INSERT INTO users (id, email, password_hash, first_name, last_name, role_id) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `);
                // Real bcrypt hash for password 'admin' (cost 10)
                const adminHash = '$2b$10$Xv4la7dWjWVgir8OLzqQYZ63dte.6vS3nwc.KT7L';
                insertUser.run(crypto.randomUUID(), 'admin', adminHash, 'Admin', 'User', adminRole.id);
            }
        }

        console.log('[database]: Migrations completed successfully');
    } catch (error) {
        console.error('[database]: Migration failed:', error);
        throw error;
    }
}
