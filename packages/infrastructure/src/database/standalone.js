import { DEFAULT_DB_CONFIG } from './types.js';
/**
 * Load Database configuration from environment variables
 */
export function loadDatabaseConfig() {
    const url = process.env.DATABASE_URL ||
        process.env.MARKETPLACE_DATABASE_URL ||
        'postgresql://localhost:5432/fuse';
    let host = process.env.DB_HOST || DEFAULT_DB_CONFIG.host;
    let port = parseInt(process.env.DB_PORT || String(DEFAULT_DB_CONFIG.port), 10);
    let user = process.env.DB_USER;
    let password = process.env.DB_PASSWORD;
    let database = process.env.DB_NAME || DEFAULT_DB_CONFIG.database;
    let ssl = process.env.DB_SSL === 'true' || DEFAULT_DB_CONFIG.ssl;
    if (url) {
        try {
            const parsed = new URL(url);
            host = parsed.hostname;
            port = parseInt(parsed.port || '5432', 10);
            user = parsed.username || undefined;
            password = parsed.password || undefined;
            database = parsed.pathname.slice(1) || DEFAULT_DB_CONFIG.database;
            // Simple SSL detection from URL
            if (url.includes('sslmode=require') || url.includes('ssl=true')) {
                ssl = true;
            }
        }
        catch (e) {
            console.error('[Infrastructure-DB] Failed to parse DATABASE_URL, using defaults');
        }
    }
    return {
        url,
        host,
        port,
        user,
        password,
        database,
        ssl,
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || String(DEFAULT_DB_CONFIG.maxConnections), 10),
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || String(DEFAULT_DB_CONFIG.idleTimeout), 10),
        connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || String(DEFAULT_DB_CONFIG.connectTimeout), 10),
    };
}
//# sourceMappingURL=standalone.js.map