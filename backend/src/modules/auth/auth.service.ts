import { pool } from '../../database/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export class AuthService {
    static async login(email: string, password: string) {
        // Allow login by exact email match OR by the 'email' column value directly (supports username-style logins like 'admin')
        const [rows]: any = await pool.execute(
            `SELECT u.*, r.name as role FROM users u 
             LEFT JOIN roles r ON u.role_id = r.id 
             WHERE u.email = ? OR u.email LIKE ?`,
            [email, `${email}@%`]
        );

        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            throw new Error('Invalid credentials');
        }

        if (!user.is_active) {
            throw new Error('Account is deactivated');
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET as string,
            { expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') as any }
        );

        // Save refresh token to db (SQLite compatible date)
        await pool.execute(
            "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, datetime('now', '+7 days'))",
            [user.id, refreshToken]
        );

        return {
            token,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
            },
        };
    }

    static async register(userData: any) {
        const passwordHash = await bcrypt.hash(userData.password, 10);
        const userId = crypto.randomUUID();

        let roleId = userData.roleId;

        // Map role name to role ID if name is provided (for frontend legacy compatibility)
        if (!roleId && userData.role) {
            const [roleRows]: any = await pool.execute(
                "SELECT id FROM roles WHERE name = ? OR name = ?",
                [userData.role, userData.role === 'admin' ? 'super_admin' : userData.role]
            );
            if (roleRows[0]) roleId = roleRows[0].id;
        }

        await pool.execute(
            'INSERT INTO users (id, email, password_hash, first_name, last_name, role_id) VALUES (?, ?, ?, ?, ?, ?)',
            [
                userId,
                userData.email,
                passwordHash,
                userData.firstName || userData.name?.split(' ')[0] || 'User',
                userData.lastName || userData.name?.split(' ').slice(1).join(' ') || '',
                roleId || null,
            ]
        );

        return { id: userId, email: userData.email };
    }

    static async getAll() {
        const [rows]: any = await pool.execute(
            `SELECT u.id, u.email, u.first_name, u.last_name, r.name as role 
             FROM users u 
             LEFT JOIN roles r ON u.role_id = r.id`
        );
        return rows.map((u: any) => ({
            id: u.id,
            name: `${u.first_name} ${u.last_name}`.trim(),
            email: u.email,
            role: u.role === 'super_admin' ? 'admin' : u.role || 'staff'
        }));
    }

    static async delete(id: string) {
        const [result]: any = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}
