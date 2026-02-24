/**
 * Seed script: Creates/resets the default admin user in the SQLite database.
 * Run with: npx tsx seed-admin.ts
 */
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'inventory.db');
const db = new Database(dbPath);

const password = 'admin';
const hash = await bcrypt.hash(password, 10);

// Find super_admin role
const role = db.prepare("SELECT id FROM roles WHERE name = 'super_admin'").get() as any;
if (!role) {
    console.error('❌ No super_admin role found. Run migrations first (start the server once).');
    process.exit(1);
}

// Remove existing admin user and insert fresh
db.prepare("DELETE FROM users WHERE email = 'admin'").run();
const userId = crypto.randomUUID();
db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active) 
    VALUES (?, ?, ?, ?, ?, ?, 1)
`).run(userId, 'admin', hash, 'Admin', 'User', role.id);

console.log('✅ Admin user seeded successfully!');
console.log(`   Username: admin`);
console.log(`   Password: ${password}`);
db.close();
