/**
 * Drizzle ORM NestJS Module
 * Provides dependency injection for the Drizzle database client
 */
import { DynamicModule } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';
export declare const DRIZZLE_CLIENT: unique symbol;
export type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;
export interface DrizzleModuleOptions {
    connectionString?: string;
    maxConnections?: number;
    idleTimeout?: number;
    connectTimeout?: number;
}
/**
 * Drizzle Database Module for NestJS
 *
 * Usage:
 * ```typescript
 * @Module({
 *   imports: [DrizzleModule.forRoot()],
 * })
 * export class AppModule {}
 * ```
 *
 * Then inject the client:
 * ```typescript
 * constructor(@Inject(DRIZZLE_CLIENT) private db: DrizzleClient) {}
 * // OR use DatabaseService (also available as DrizzleService alias):
 * constructor(private db: DatabaseService) {}
 * ```
 */
export declare class DrizzleModule {
    /**
     * Register the module with default configuration (uses DATABASE_URL env var)
     */
    static forRoot(options?: DrizzleModuleOptions): DynamicModule;
    /**
     * Register the module with async configuration (uses ConfigService)
     */
    static forRootAsync(): DynamicModule;
}
/**
 * Drizzle Service - Alternative injectable wrapper
 */
import { OnModuleDestroy } from '@nestjs/common';
export declare class DrizzleService implements OnModuleDestroy {
    private readonly db;
    constructor(db: DrizzleClient);
    /**
     * Get the database client instance
     */
    get client(): DrizzleClient;
    /**
     * Execute a raw SQL query
     */
    executeRaw<T = unknown>(query: string, params?: unknown[]): Promise<T[]>;
    /**
     * Health check - verify database connectivity
     */
    healthCheck(): Promise<boolean>;
    /**
     * Cleanup on module destroy
     */
    onModuleDestroy(): Promise<void>;
}
//# sourceMappingURL=drizzle.module.d.ts.map