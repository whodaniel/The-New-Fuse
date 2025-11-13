export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    connectionTimeout?: number;
    maxConnections?: number;
}
export declare const databaseConfig: DatabaseConfig;
//# sourceMappingURL=database.config.d.ts.map