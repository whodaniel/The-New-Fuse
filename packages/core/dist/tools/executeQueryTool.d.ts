import { z } from 'zod';
export declare const ExecuteQueryToolSchema: z.ZodObject<{
    query: z.ZodString;
    params: z.ZodDefault<z.ZodArray<z.ZodUnknown>>;
    readOnly: z.ZodDefault<z.ZodBoolean>;
    timeoutMs: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type ExecuteQueryParams = z.infer<typeof ExecuteQueryToolSchema>;
export interface QueryResult {
    rows: Record<string, unknown>[];
    rowCount: number;
    durationMs: number;
    error?: string;
}
export interface DatabaseClient {
    query(sql: string, params?: unknown[]): Promise<{
        rows: Record<string, unknown>[];
        rowCount: number;
    }>;
}
export declare class ExecuteQueryTool {
    private client;
    private allowWrites;
    constructor(client: DatabaseClient, allowWrites?: boolean);
    execute(params: ExecuteQueryParams): Promise<QueryResult>;
    private isWriteQuery;
}
//# sourceMappingURL=executeQueryTool.d.ts.map