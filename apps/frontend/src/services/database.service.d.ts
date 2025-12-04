import { DatabaseStats, DatabaseConfig } from '@/types/database';
export declare class DatabaseService {
    private static instance;
    private enhancedDb;
    private logger;
    private metrics;
    private constructor();
    static getInstance(): DatabaseService;
    private static withRetry;
    static getStats(): Promise<DatabaseStats>;
    static getConfigurations(): Promise<DatabaseConfig[]>;
    static createBackup(): Promise<void>;
    static restoreFromBackup(formData: FormData): Promise<void>;
    static runMigrations(): Promise<void>;
    static checkConnection(): Promise<boolean>;
    static getQueryStats(): Promise<{
        totalQueries: number;
        averageTime: number;
        errorRate: number;
    }>;
    static getLogs(limit?: number): Promise<Array<{
        timestamp: string;
        level: string;
        message: string;
    }>>;
}
