import { MetricsCollector } from '../monitoring/metricsCollector.js';
export interface DatabaseConfig {
    type: postgres' | 'mysql' | 'sqlite';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database: string;
    schema?: string;
    ssl?: boolean;
    migrations?: string[];
    entities?: string[];
    synchronize?: boolean;
    logging?: boolean;
}
export interface DatabaseStats {
    timestamp: number;
    connections: {
        active: number;
        idle: number;
        total: number;
    };
    queries: {
        total: number;
        failed: number;
        avgDuration: number;
    };
    migrations: {
        pending: number;
        executed: number;
        failed: number;
    };
    tables: {
        count: number;
        totalRows: number;
        size: number;
    };
}
export declare class DatabaseManager {
    private readonly config;
    private readonly metricsCollector;
    private dataSource;
    private stats;
    private queryLog;
    constructor(config: DatabaseConfig, metricsCollector: MetricsCollector);
    private initializeStats;
}
