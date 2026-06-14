/**
 * Database Service
 * Handles database connections using Drizzle ORM
 * This replaces the legacy DrizzleService
 */
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { type DrizzleClient } from '@the-new-fuse/database';
export declare class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly db;
    private readonly logger;
    constructor(db: DrizzleClient);
    /**
     * Get the database client instance
     */
    get client(): DrizzleClient;
    /**
     * Initialize connection when module starts
     */
    onModuleInit(): Promise<void>;
    /**
     * Close connection when module shuts down
     */
    onModuleDestroy(): Promise<void>;
    /**
     * Execute a raw SQL query
     */
    executeRaw<T = unknown>(query: string): Promise<T[]>;
    /**
     * Health check - verify database connectivity
     */
    healthCheck(): Promise<boolean>;
    /**
     * Enable shutdown hooks for graceful shutdown
     */
    enableShutdownHooks(app: any): Promise<void>;
}
export default DatabaseService;
//# sourceMappingURL=database.service.d.ts.map