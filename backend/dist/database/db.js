import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
const dbConfig = {
    host: process.env.DB_HOST?.split(':')[0] || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
export const pool = mysql.createPool(dbConfig);
// Compatibility wrapper as a separate export if needed, 
// but we'll export the pool directly and use standard promise-based API.
export const db = {
    prepare: (sql) => {
        // Mocking the SQLite 'prepare' pattern for minimal changes elsewhere
        return {
            run: async (...params) => {
                const [result] = await pool.execute(sql, params);
                return result;
            },
            get: async (...params) => {
                const [rows] = await pool.execute(sql, params);
                return rows[0];
            },
            all: async (...params) => {
                const [rows] = await pool.execute(sql, params);
                return rows;
            }
        };
    },
    transaction: (fn) => {
        return async (...args) => {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                const result = await fn(connection, ...args);
                await connection.commit();
                return result;
            }
            catch (error) {
                await connection.rollback();
                throw error;
            }
            finally {
                connection.release();
            }
        };
    },
    exec: async (sql) => {
        // MySQL doesn't have a single .exec for multi-statement strings easily with pool.execute
        // We'll split by ; for basic migrations if needed, but better to use connection.query
        const connection = await pool.getConnection();
        try {
            await connection.query(sql);
        }
        finally {
            connection.release();
        }
    }
};
export async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('[database]: MySQL connected successfully to', process.env.DB_NAME);
        connection.release();
        return true;
    }
    catch (error) {
        console.error('[database]: MySQL connection failed:', error);
        return false;
    }
}
