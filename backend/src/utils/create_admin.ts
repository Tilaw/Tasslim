import { pool } from '../database/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

function getAdminConfig() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const firstName = process.env.ADMIN_FIRST_NAME ?? 'System';
    const lastName = process.env.ADMIN_LAST_NAME ?? 'Admin';

    if (!email || !password) {
        throw new Error('Missing required env vars: ADMIN_EMAIL and ADMIN_PASSWORD must be set.');
    }

    return { email, password, firstName, lastName };
}

async function createAdmin() {
    try {
        logger.info('Creating production admin user...');

        const { email, password, firstName, lastName } = getAdminConfig();

        // 1. Get or create admin role
        const [roles]: any = await pool.execute("SELECT id FROM roles WHERE name = 'admin'");
        let roleId: string;

        if (roles.length === 0) {
            logger.warn('admin role not found. Creating it...');
            roleId = crypto.randomUUID();
            await pool.execute(
                "INSERT INTO roles (id, name, description) VALUES (?, ?, ?)",
                [roleId, 'admin', 'Standard administrative access']
            );
        } else {
            roleId = roles[0].id;
        }

        // 2. Hash password
        logger.info(`Hashing password for ${email}...`);
        const passwordHash = await bcrypt.hash(password, 12); // bumped from 10 → 12

        // 3. Upsert user
        const [existing]: any = await pool.execute(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existing.length > 0) {
            logger.info('User already exists — updating password and ensuring active status...');
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

        // 4. Confirm without echoing the password
        logger.info(`Admin ready → ${email}`);

        process.exit(0);
    } catch (error) {
        logger.error('Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();