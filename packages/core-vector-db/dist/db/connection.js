import { Pool } from 'pg';
let pool = null;
export function getPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 10,
            idleTimeoutMillis: 30000,
        });
    }
    return pool;
}
export async function query(text, params) {
    const client = await getPool().connect();
    try {
        return await client.query(text, params);
    }
    finally {
        client.release();
    }
}
export async function withClient(fn) {
    const client = await getPool().connect();
    try {
        return await fn(client);
    }
    finally {
        client.release();
    }
}
export async function disconnect() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
//# sourceMappingURL=connection.js.map