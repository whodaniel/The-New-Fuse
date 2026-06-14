import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
export declare function getPool(): Pool;
export declare function query<T extends QueryResultRow = QueryResultRow>(text: string, params?: any[]): Promise<QueryResult<T>>;
export declare function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
export declare function disconnect(): Promise<void>;
//# sourceMappingURL=connection.d.ts.map