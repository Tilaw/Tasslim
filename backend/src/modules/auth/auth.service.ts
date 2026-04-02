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

        // Save refresh token to db
        await pool.execute(
            "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))",
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

    /** Issue a new access token using a valid refresh token (no password). */
    static async refresh(refreshToken: string) {
        if (!refreshToken || typeof refreshToken !== 'string') {
            throw new Error('Refresh token required');
        }
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string) as { userId: string };
        const [rows]: any = await pool.execute(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, r.name as role
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             WHERE u.id = ?`,
            [decoded.userId]
        );
        const user = rows[0];
        if (!user || !user.is_active) {
            throw new Error('User not found or inactive');
        }
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
        );
        return {
            token,
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

    static async updateUser(
        id: string,
        updates: { email?: string; password?: string; currentPassword?: string },
        actor: { userId: string; role: string }
    ) {
        const isSelf = actor.userId === id;
        const elevated = new Set(['admin', 'super_admin']);
        const isElevated = elevated.has(actor.role);

        if (!isSelf && !isElevated) {
            const err: any = new Error('Insufficient permissions');
            err.status = 403;
            err.code = 'FORBIDDEN';
            throw err;
        }

        const [rows]: any = await pool.execute(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, r.name as role
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             WHERE u.id = ?`,
            [id]
        );
        const user = rows[0];
        if (!user) {
            const err: any = new Error('User not found');
            err.status = 404;
            err.code = 'NOT_FOUND';
            throw err;
        }

        const nextEmail = (updates.email ?? user.email)?.toString().trim();
        const nextPassword = updates.password?.toString();
        const currentPassword = updates.currentPassword?.toString();

        if (updates.email !== undefined) {
            if (!nextEmail) {
                const err: any = new Error('Email or username is required');
                err.status = 400;
                err.code = 'VALIDATION_ERROR';
                throw err;
            }
            const [dupes]: any = await pool.execute(
                'SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1',
                [nextEmail, id]
            );
            if (dupes[0]) {
                const err: any = new Error('Email is already in use');
                err.status = 409;
                err.code = 'CONFLICT';
                throw err;
            }
        }

        let passwordHash: string | undefined;
        if (nextPassword !== undefined) {
            if (!nextPassword || nextPassword.length < 6) {
                const err: any = new Error('Password must be at least 6 characters');
                err.status = 400;
                err.code = 'VALIDATION_ERROR';
                throw err;
            }

            // For self-service password updates, require current password verification.
            // Admin updates are allowed without current password.
            if (isSelf && !isElevated) {
                if (!currentPassword) {
                    const err: any = new Error('Current password is required');
                    err.status = 400;
                    err.code = 'VALIDATION_ERROR';
                    throw err;
                }
                const ok = await bcrypt.compare(currentPassword, user.password_hash);
                if (!ok) {
                    const err: any = new Error('Current password is incorrect');
                    err.status = 401;
                    err.code = 'UNAUTHORIZED';
                    throw err;
                }
            }
            passwordHash = await bcrypt.hash(nextPassword, 10);
        }

        await pool.execute(
            `UPDATE users
             SET email = COALESCE(?, email),
                 password_hash = COALESCE(?, password_hash),
                 updated_at = NOW()
             WHERE id = ?`,
            [
                updates.email !== undefined ? nextEmail : null,
                passwordHash !== undefined ? passwordHash : null,
                id,
            ]
        );

        const [updatedRows]: any = await pool.execute(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, r.name as role
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             WHERE u.id = ?`,
            [id]
        );
        const updated = updatedRows[0];

        return {
            id: updated.id,
            email: updated.email,
            firstName: updated.first_name,
            lastName: updated.last_name,
            role: updated.role === 'super_admin' ? 'admin' : updated.role || 'staff',
            isActive: !!updated.is_active,
        };
    }
}
