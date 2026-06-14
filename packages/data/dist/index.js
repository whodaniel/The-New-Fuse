"use strict";
/**
 * @the-new-fuse/data
 * Unified Data Stack
 *
 * Provides a single entry point for all data-related operations:
 * - Relational (Drizzle ORM)
 * - Vector (pgvector/qdrant)
 * - Shared Configuration
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataStack = exports.loadDatabaseConfig = void 0;
__exportStar(require("@the-new-fuse/core-vector-db"), exports);
__exportStar(require("@the-new-fuse/database"), exports);
var infrastructure_1 = require("@the-new-fuse/infrastructure");
Object.defineProperty(exports, "loadDatabaseConfig", { enumerable: true, get: function () { return infrastructure_1.loadDatabaseConfig; } });
const core_vector_db_1 = require("@the-new-fuse/core-vector-db");
const database_1 = require("@the-new-fuse/database");
const infrastructure_2 = require("@the-new-fuse/infrastructure");
/**
 * Unified Data Stack Helper
 */
class DataStack {
    static getRelational() {
        return database_1.db;
    }
    static getQueryClient() {
        return database_1.queryClient;
    }
    static async createVectorService(options) {
        const config = (0, infrastructure_2.loadDatabaseConfig)();
        // Create driver
        const driver = new core_vector_db_1.PgVectorDriver({
            provider: 'pgvector',
            connectionString: config.url,
            host: config.host,
            port: config.port,
            database: config.database,
            ssl: config.ssl,
            poolSize: config.maxConnections,
            timeout: config.idleTimeout * 1000,
        });
        // Create embedding provider
        const embeddingProvider = new core_vector_db_1.OpenAIEmbeddingProvider({
            provider: 'openai',
            apiKey: options?.apiKey || process.env.OPENAI_API_KEY || '',
            model: options?.model || 'text-embedding-3-small',
        });
        return new core_vector_db_1.VectorDatabaseService(driver, embeddingProvider);
    }
}
exports.DataStack = DataStack;
//# sourceMappingURL=index.js.map