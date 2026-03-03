import { pool } from '../database/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

async function createAdmin() {
    try {
        logger.info('Creating production admin user...');

        // 1. Get super_admin role
        const [roles]: any = await pool.execute("SELECT id FROM roles WHERE name = 'super_admin'");
        let roleId: string;

        if (roles.length === 0) {
            logger.warn('super_admin role not found. Creating it...');
            roleId = crypto.randomUUID();
            await pool.execute(
                "INSERT INTO roles (id, name, description) VALUES (?, ?, ?)",
                [roleId, 'super_admin', 'Full system access']
            );
        } else {
            roleId = roles[0].id;
        }

        // 2. Define user details
        const email = 'admin@taslimalwataniah.ae';
        const password = 'taslima!@#$%';
        const firstName = 'System';
        const lastName = 'Admin';

        logger.info(`Hashing password for ${email}...`);
        const passwordHash = await bcrypt.hash(password, 10);

        // 3. Check if user already exists
        const [existing]: any = await pool.execute("SELECT id FROM users WHERE email = ?", [email]);

        if (existing.length > 0) {
            logger.info('User already exists, updating password and ensuring active status...');
            await pool.execute(
                "UPDATE users SET password_hash = ?, first_name = ?, last_name = ?, role_id = ?, is_active = 1 WHERE email = ?",
                [passwordHash, firstName, lastName, roleId, email]
            );
            logger.success('Admin user updated successfully.');
        } else {
            logger.info('Inserting new admin user...');
            await pool.execute(
                "INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
                [crypto.randomUUID(), email, passwordHash, firstName, lastName, roleId]
            );
            logger.success('Admin user created successfully.');
        }

        console.log('\n--- Production Admin Credentials ---');
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log('------------------------------------\n');

        process.exit(0);
    } catch (error) {
        logger.error('Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();
