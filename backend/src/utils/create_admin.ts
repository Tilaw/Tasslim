import { pool } from '../database/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
    try {
        console.log('Creating demo admin user...');

        // 1. Get super_admin role
        const [roles]: any = await pool.execute("SELECT id FROM roles WHERE name = 'super_admin'");
        if (roles.length === 0) {
            console.error('Error: super_admin role not found. Please run migrations first.');
            process.exit(1);
        }
        const roleId = roles[0].id;

        // 2. Define user details
        const email = 'admin@tasslim.com';
        const password = 'admin123';
        const firstName = 'Demo';
        const lastName = 'Admin';

        console.log(`Hashing password for ${email}...`);
        const passwordHash = await bcrypt.hash(password, 10);

        // 3. Check if user already exists
        const [existing]: any = await pool.execute("SELECT id FROM users WHERE email = ?", [email]);

        if (existing.length > 0) {
            console.log('User already exists, updating password...');
            await pool.execute(
                "UPDATE users SET password_hash = ?, first_name = ?, last_name = ?, role_id = ?, is_active = 1 WHERE email = ?",
                [passwordHash, firstName, lastName, roleId, email]
            );
            console.log('Admin user updated successfully.');
        } else {
            console.log('Inserting new admin user...');
            await pool.execute(
                "INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
                [crypto.randomUUID(), email, passwordHash, firstName, lastName, roleId]
            );
            console.log('Admin user created successfully.');
        }

        console.log('\n--- Demo Admin Credentials ---');
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log('-------------------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();
