"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
exports.databaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'fuse',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    connectionTimeout: parseInt(process.env.DB_TIMEOUT || '30000', 10),
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10)
};
//# sourceMappingURL=database.config.js.map