/**
 * Seed script: Creates/resets the default admin user in the SQLite database.
 * Run with: node seed-admin.js
 */
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');

const dbPath = path.join(__dirname, 'inventory.db');
const db = new Database(dbPath);

async function seed() {
    const password = 'admin';
    const hash = await bcrypt.hash(password, 10);

    // Find super_admin role
    const role = db.prepare("SELECT id FROM roles WHERE name = 'super_admin'").get();
    if (!role) {
        console.error('❌ No super_admin role found. Run migrations first.');
        process.exit(1);
    }

    // Remove existing admin user
    db.prepare("DELETE FROM users WHERE email = 'admin'").run();

    // Insert fresh admin user
    const userId = crypto.randomUUID();
    db.prepare(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(userId, 'admin', hash, 'Admin', 'User', role.id);

    console.log('✅ Admin user seeded successfully!');
    console.log(`   Email/Username: admin`);
    console.log(`   Password: ${password}`);
    console.log(`   Hash: ${hash}`);
    db.close();
}

seed().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
