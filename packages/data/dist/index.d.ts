/**
 * @the-new-fuse/data
 * Unified Data Stack
 *
 * Provides a single entry point for all data-related operations:
 * - Relational (Drizzle ORM)
 * - Vector (pgvector/qdrant)
 * - Shared Configuration
 */
export * from '@the-new-fuse/core-vector-db';
export * from '@the-new-fuse/database';
export { loadDatabaseConfig } from '@the-new-fuse/infrastructure';
import { VectorDatabaseService } from '@the-new-fuse/core-vector-db';
/**
 * Unified Data Stack Helper
 */
export declare class DataStack {
    static getRelational(): import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../../database/dist/drizzle/schema")> & {
        $client: import("postgres").Sql<{}>;
    };
    static getQueryClient(): import("postgres").Sql<{}>;
    static createVectorService(options?: {
        apiKey?: string;
        model?: string;
    }): Promise<VectorDatabaseService>;
}
//# sourceMappingURL=index.d.ts.map