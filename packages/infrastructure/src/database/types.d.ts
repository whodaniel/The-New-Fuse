export interface DatabaseConfig {
    url: string;
    host: string;
    port: number;
    user?: string;
    password?: string;
    database: string;
    ssl: boolean;
    maxConnections: number;
    idleTimeout: number;
    connectTimeout: number;
}
export declare const DEFAULT_DB_CONFIG: Partial<DatabaseConfig>;
//# sourceMappingURL=types.d.ts.map