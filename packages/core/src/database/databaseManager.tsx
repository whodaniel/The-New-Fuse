// filepath: /Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/packages/core/src/database/databaseManager.tsx
import { DataSource, DataSourceOptions } from 'typeorm';
import { Logger } from 'winston';
import { getLogger } from '../logging/loggingConfig.js';
import { MetricsCollector } from '../monitoring/metricsCollector.js';
import * as path from 'path';
import * as fs from 'fs/promises';

const logger: Logger = getLogger('database_manager');

export interface DatabaseConfig {
    type: 'postgres' | 'mysql' | 'sqlite';
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
    poolSize?: number;
    timeout?: number;
    metricsInterval?: number;
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

export interface QueryLogItem {
    query: string;
    duration: number;
    timestamp: number;
    error?: Error;
}

export class DatabaseManager {
    private dataSource: DataSource | null = null;
    private config: DatabaseConfig;
    private metricsCollector: MetricsCollector;
    private stats: DatabaseStats;
    private queryLog: QueryLogItem[];
    private connectionPool: any; // Replace with actual type if needed
    private initialized = false;

    constructor(
        config: DatabaseConfig,
        metricsCollector: MetricsCollector
    ) {
        this.config = this.validateConfig(config);
        this.metricsCollector = metricsCollector;
        this.stats = this.initializeStats();
        this.queryLog = [];
        this.connectionPool = null;
    }

    private validateConfig(config: DatabaseConfig): DatabaseConfig {
        // Validate required fields
        if (!config.database) {
            throw new Error('Database name is required');
        }

        // Set defaults
        return {
            type: config.type || 'postgres',
            host: config.host || 'localhost',
            port: config.port || 5432,
            synchronize: config.synchronize || false,
            logging: config.logging || false,
            ...config
        };
    }

    private initializeStats(): DatabaseStats {
        return {
            timestamp: Date.now(),
            connections: {
                active: 0,
                idle: 0,
                total: 0
            },
            queries: {
                total: 0,
                failed: 0,
                avgDuration: 0
            },
            migrations: {
                pending: 0,
                executed: 0,
                failed: 0
            },
            tables: {
                count: 0,
                totalRows: 0,
                size: 0
            }
        };
    }

    public async initialize(): Promise<void> {
        try {
            const options: DataSourceOptions = {
                type: this.config.type as any,
                host: this.config.host,
                port: this.config.port,
                username: this.config.username,
                password: this.config.password,
                database: this.config.database,
                schema: this.config.schema,
                ssl: this.config.ssl,
                synchronize: this.config.synchronize,
                logging: this.config.logging,
                entities: this.config.entities || [],
                migrations: this.config.migrations || [],
                subscribers: []
            };

            this.dataSource = new DataSource(options);
            await this.dataSource.initialize();
            this.initialized = true;

            // Set up metrics collection
            if (this.config.metricsInterval) {
                setInterval(() => this.collectMetrics(), this.config.metricsInterval);
            }

            logger.info(`Database connection established to ${this.config.host}:${this.config.port}/${this.config.database}`);
        } catch (error) {
            logger.error('Failed to initialize database connection:', error);
            throw error;
        }
    }

    private async collectMetrics(): Promise<void> {
        if(!this.dataSource) return;

        try {
            // Update connection stats
            const poolStats = await this.getConnectionStats();
            this.stats.connections = poolStats;

            // Collect query metrics
            this.metricsCollector.recordMetric('database.queries.total', this.stats.queries.total);
            this.metricsCollector.recordMetric('database.queries.failed', this.stats.queries.failed);
            this.metricsCollector.recordMetric('database.queries.avgDuration', this.stats.queries.avgDuration);

            // Collect connection metrics
            this.metricsCollector.recordMetric('database.connections.active', poolStats.active);
            this.metricsCollector.recordMetric('database.connections.idle', poolStats.idle);
            this.metricsCollector.recordMetric('database.connections.total', poolStats.total);
        } catch (error) {
            logger.error('Error collecting database metrics:', error);
        }
    }

    public logQueries(queries: { query: string, duration: number }[]): void {
        queries.forEach(query => {
            this.queryLog.push({
                query: query.query,
                duration: query.duration,
                timestamp: Date.now()
            });
            
            // Update query stats
            this.stats.queries.total++;
            this.stats.queries.avgDuration = 
                (this.stats.queries.avgDuration * (this.stats.queries.total - 1) + query.duration) / 
                this.stats.queries.total;
        });
    }

    public logFailedQuery(query: string, error: Error): void {
        this.queryLog.push({
            query,
            duration: 0,
            timestamp: Date.now(),
            error
        });
        
        this.stats.queries.total++;
        this.stats.queries.failed++;
    }

    public async getConnectionStats(): Promise<{ active: number, idle: number, total: number }> {
        if (!this.dataSource) {
            return { active: 0, idle: 0, total: 0 };
        }

        try {
            // This is a placeholder - actual implementation depends on database driver
            const pool = (this.dataSource as any).driver?.pool;
            if (pool) {
                return {
                    active: pool.activeConnections || 0,
                    idle: pool.idleConnections || 0,
                    total: pool.totalConnections || 0
                };
            }
        } catch (error) {
            logger.error('Error getting connection stats:', error);
        }

        return { active: 0, idle: 0, total: 0 };
    }

    public async getStats(): Promise<DatabaseStats> {
        // Update the stats with current data
        this.stats.timestamp = Date.now();
        this.stats.connections = await this.getConnectionStats();
        
        return this.stats;
    }

    public async close(): Promise<void> {
        if (this.dataSource && this.dataSource.isInitialized) {
            await this.dataSource.destroy();
            this.initialized = false;
            logger.info('Database connection closed');
        }
    }

    public getDataSource(): DataSource | null {
        return this.dataSource;
    }

    public isInitialized(): boolean {
        return this.initialized;
    }
}
