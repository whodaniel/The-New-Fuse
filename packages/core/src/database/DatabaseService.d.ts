/**
 * @fileoverview Production-ready database service with connection management
 */
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ServiceState } from '../constants/types';
import { ConfigService } from '../config/ConfigService';
export interface DatabaseConnection {
    id: string;
    isActive: boolean;
    createdAt: Date;
    lastUsed: Date;
    queryCount: number;
}
export interface DatabaseStats {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    totalQueries: number;
    averageQueryTime: number;
    errorCount: number;
    uptime: number;
}
export interface QueryResult<T = any> {
    data: T[];
    count: number;
    executionTime: number;
    affectedRows?: number;
}
export interface TransactionContext {
    id: string;
    startTime: Date;
    operations: string[];
    isActive: boolean;
}
export declare class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private state;
    private connections;
    private stats;
    private startTime;
    private healthCheckInterval?;
    private connectionPool;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    getState(): ServiceState;
    query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
    findOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
    findMany<T = any>(sql: string, params?: any[]): Promise<T[]>;
    insert<T = any>(table: string, data: Record<string, any>): Promise<QueryResult<T>>;
    update<T = any>(table: string, data: Record<string, any>, where: Record<string, any>): Promise<QueryResult<T>>;
    delete<T = any>(table: string, where: Record<string, any>): Promise<QueryResult<T>>;
    transaction<T>(operations: (context: TransactionContext) => Promise<T>): Promise<T>;
    getConnection(): Promise<DatabaseConnection>;
    releaseConnection(connectionId: string): Promise<void>;
    getStats(): DatabaseStats;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: Record<string, any>;
    }>;
    private ensureRunning;
    private initializeConnectionPool;
    private closeAllConnections;
    private executeQuery;
    private beginTransaction;
    private commitTransaction;
    private rollbackTransaction;
    private performHealthCheck;
    private updateQueryStats;
    private updateConnectionStats;
    private initializeStats;
    private generateQueryId;
    private generateTransactionId;
    private generateConnectionId;
    private sanitizeSql;
}
//# sourceMappingURL=DatabaseService.d.ts.map