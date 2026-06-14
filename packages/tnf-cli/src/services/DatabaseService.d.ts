export interface DatabaseOptions {
    format?: 'json' | 'tsv';
}
export interface QueryResult {
    columns: string[];
    rows: Record<string, unknown>[];
}
export declare class DatabaseService {
    private dbPath;
    private dataPath;
    private data;
    constructor(dbPath?: string);
    private loadData;
    private saveData;
    getPath(): string;
    openInteractive(): Promise<void>;
    query(sql: string, options?: DatabaseOptions): Promise<QueryResult>;
    migrate(): Promise<{
        migrated: number;
        errors: string[];
    }>;
    getTable(name: string): unknown[];
    setTable(name: string, data: unknown[]): void;
    insert(name: string, record: Record<string, unknown>): void;
}
//# sourceMappingURL=DatabaseService.d.ts.map