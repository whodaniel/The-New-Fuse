import postgres from 'postgres';
import * as schema from './schema.js';
export declare const queryClient: postgres.Sql<{}>;
export declare const db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
    $client: postgres.Sql<{}>;
};
export { schema };
export type Database = typeof db;
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
//# sourceMappingURL=client.d.ts.map