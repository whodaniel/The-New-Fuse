import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource, DataSourceOptions, QueryRunner } from 'typeorm';
import { Logger } from '../logging/logger.service.js';
import { MetricsCollector } from '../monitoring/metrics-collector.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Mutex } from 'async-mutex';
import { DatabaseConfig, DatabaseStats, QueryLogEntry } from './types.js';
import { ConnectionPool } from './connection-pool.js';
import { retry } from '../utils/retry.js';

@Injectable()
export class EnhancedDatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly logger: Logger = new Logger(EnhancedDatabaseService.name);
    private dataSource: DataSource | null = null;
    private connectionPool: ConnectionPool | null = null;
    private readonly queryLog: QueryLogEntry[] = [];
    private stats: DatabaseStats;
    private readonly mutex = new Mutex();
    private isInitialized = false;

    constructor(
        private readonly config: DatabaseConfig,
        private readonly metricsCollector: MetricsCollector,
        private readonly eventEmitter: EventEmitter2
    ) {
        this.stats = this.initializeStats();
    }

    async onModuleInit(): Promise<void> {
        await this.initialize();
    }

    async onModuleDestroy(): Promise<void> {
        await this.cleanup();
    }

    private async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }
        const release = await this.mutex.acquire();
        try {
            if (this.isInitialized) return; // Double check after acquiring lock

            this.logger.info('Initializing database connection...');
            if (this.config.type === 'sqlite' && this.config.useConnectionPool) {
                this.connectionPool = new ConnectionPool({
                    poolSize: this.config.poolSize || 5,
                    timeout: this.config.timeout || 30000,
                    databasePath: this.config.database,
                });
                await this.connectionPool.initialize();
                this.logger.info('SQLite connection pool initialized.');
            } else {
                const options = this.getDataSourceOptions();
                this.dataSource = new DataSource(options);
                await this.dataSource.initialize();
                this.logger.info('Database connection initialized successfully.');
            }

            this.isInitialized = true;
            this.startMetricsCollection();
            this.eventEmitter.emit('database.initialized', {
                timestamp: Date.now(),
                config: this.sanitizeConfig(this.config),
            });
        } catch (error: any) {
            this.logger.error('Failed to initialize database', { error: error.message });
            this.eventEmitter.emit('database.error', {
                timestamp: Date.now(),
                error: error.message,
                config: this.sanitizeConfig(this.config),
            });
            throw error; // Re-throw to prevent application startup if critical
        } finally {
            release();
        }
    }

    private async cleanup(): Promise<void> {
        if (!this.isInitialized) {
            return;
        }
        const release = await this.mutex.acquire();
        try {
            if (!this.isInitialized) return; // Double check

            this.logger.info('Cleaning up database connections...');
            if (this.connectionPool) {
                await this.connectionPool.cleanup();
                this.logger.info('SQLite connection pool cleaned up.');
            }
            if (this.dataSource?.isInitialized) {
                await this.dataSource.destroy();
                this.logger.info('Database connection destroyed.');
            }

            this.isInitialized = false;
            this.eventEmitter.emit('database.shutdown', {
                timestamp: Date.now(),
            });
        } catch (error: any) {
            this.logger.error('Error during database cleanup', { error: error.message });
        } finally {
            release();
        }
    }

    async executeQuery<T = any>(
        query: string,
        params?: any[],
        options: {
            retries?: number;
            timeout?: number;
            transaction?: boolean; // Note: transaction management might be more complex
        } = {}
    ): Promise<T> {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        const startTime = Date.now();
        let queryRunner: QueryRunner | null = null;

        try {
            if (options.transaction && this.dataSource) {
                queryRunner = this.dataSource.createQueryRunner();
                await queryRunner.connect();
                await queryRunner.startTransaction();
            }

            const result = await retry(
                async () => {
                    if (queryRunner) {
                        return await queryRunner.query(query, params);
                    } else if (this.connectionPool) {
                        return await this.connectionPool.execute(query, params);
                    } else if (this.dataSource) {
                        return await this.dataSource.query(query, params);
                    }
                    throw new Error('No database connection available');
                },
                {
                    retries: options.retries || this.config.retries || 3,
                    timeout: options.timeout || this.config.queryTimeout || 5000,
                    onError: (error: Error) => {
                        this.logger.warn(`Query failed, retrying...`, { query, error: error.message });
                    },
                }
            );

            if (queryRunner) {
                await queryRunner.commitTransaction();
            }
            this.logQuery(query, Date.now() - startTime);
            return result;
        } catch (error: any) {
            if (queryRunner?.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            this.logQuery(query, Date.now() - startTime, error);
            this.logger.error('Query execution failed', {
                query,
                params,
                error: error.message,
            });
            this.stats.queries.failed++;
            throw error;
        } finally {
            if (queryRunner) {
                await queryRunner.release();
            }
        }
    }

    async getStats(): Promise<DatabaseStats> {
        const release = await this.mutex.acquire();
        try {
            if (this.dataSource?.isInitialized && this.config.type !== 'sqlite') { // Assuming stats are more relevant for non-sqlite
                // Example: Query for number of tables (specific to DB type)
                // For PostgreSQL:
                // const [{ totalTables }] = await this.dataSource.query('SELECT COUNT(*) as "totalTables" FROM information_schema.tables WHERE table_schema = \'public\';');
                // this.stats.tables.count = parseInt(totalTables, 10);
            } else if (this.connectionPool) {
                const poolStats = this.connectionPool.getStats();
                this.stats.connections.active = poolStats.activeConnections;
                this.stats.connections.idle = poolStats.idleConnections;
                this.stats.connections.total = poolStats.totalConnections;
            }
            this.stats.timestamp = Date.now();
            return { ...this.stats };
        } catch (error: any) {
            this.logger.error('Failed to retrieve database stats', { error: error.message });
            return { ...this.stats }; // Return current stats even if update fails
        }
        finally {
            release();
        }
    }

    private getDataSourceOptions(): DataSourceOptions {
        const baseOptions: DataSourceOptions = {
            type: this.config.type,
            database: this.config.database,
            synchronize: this.config.synchronize || false,
            logging: this.config.logging || false, // Consider custom logger integration
            entities: this.config.entities || [__dirname + '/../**/*.entity{.ts,.js}'],
            migrations: this.config.migrations || [__dirname + '/../migrations/*{.ts,.js}'],
            subscribers: this.config.subscribers || [],
            extra: this.config.extra,
        };

        if (this.config.type !== 'sqlite') {
            Object.assign(baseOptions, {
                host: this.config.host,
                port: this.config.port,
                username: this.config.username,
                password: this.config.password,
                schema: this.config.schema,
                ssl: this.config.ssl,
                replication: this.config.replication, // For read-replicas etc.
            });
        }
        return baseOptions;
    }

    private initializeStats(): DatabaseStats {
        return {
            timestamp: Date.now(),
            connections: {
                active: 0,
                idle: 0,
                total: 0,
            },
            queries: {
                total: 0,
                failed: 0,
                avgDuration: 0,
            },
            migrations: {
                pending: 0, // This would require checking migration status
                executed: 0,
                failed: 0,
            },
            tables: { // These are harder to get generically and might be DB specific
                count: 0,
                totalRows: 0,
                size: 0, // in bytes or MB
            },
        };
    }

    private startMetricsCollection(): void {
        const interval = this.config.metricsInterval || 60000; // Default to 1 minute

        setInterval(async () => {
            try {
                const currentStats = await this.getStats();
                this.metricsCollector.recordMetrics('database', {
                    activeConnections: currentStats.connections.active,
                    idleConnections: currentStats.connections.idle,
                    totalConnections: currentStats.connections.total,
                    queryCount: currentStats.queries.total,
                    failedQueryCount: currentStats.queries.failed,
                    avgQueryDurationMs: currentStats.queries.avgDuration,
                    // Add more metrics as needed
                });
            } catch (error: any) {
                this.logger.error('Failed to collect database metrics', { error: error.message });
            }
        }, interval);
    }

    private logQuery(query: string, duration: number, error?: Error): void {
        const entry: QueryLogEntry = {
            query,
            duration,
            timestamp: new Date(),
            success: !error,
            errorMessage: error?.message,
        };
        if (this.queryLog.length >= (this.config.queryLogSize || 1000)) { // Keep last N queries
            this.queryLog.shift();
        }
        this.queryLog.push(entry);

        this.stats.queries.total++;
        if (error) {
            this.stats.queries.failed++;
        }
        // Calculate new average duration
        this.stats.queries.avgDuration =
            (this.stats.queries.avgDuration * (this.stats.queries.total - 1) + duration) /
            this.stats.queries.total;
    }

    private sanitizeConfig(config: DatabaseConfig): Partial<DatabaseConfig> {
        const { password, ...safeConfig } = config; // Remove sensitive info
        return safeConfig;
    }

    // Public utility methods
    async clearQueryLog(): Promise<void> {
        this.queryLog.length = 0;
        this.logger.info('Query log cleared.');
    }

    getQueryLog(): QueryLogEntry[] {
        return [...this.queryLog]; // Return a copy
    }

    isConnected(): boolean {
        return this.isInitialized && (
            this.dataSource?.isInitialized ||
            (this.connectionPool?.isInitialized() ?? false)
        );
    }

    async updateById<T>(id: string, data: Partial<T>, tableName: string): Promise<T | undefined> {
        try {
          // ...existing code...
        } catch (error: any) {
          this.logger.error(`Error updating ${tableName} by id: ${id}, error: ${error.message}`);
          return undefined;
        }
      }
    
      async update<T>(query: any, data: Partial<T>, tableName: string): Promise<T | undefined> {
        try {
          // ...existing code...
        } catch (error: any) {
          this.logger.error(`Error updating ${tableName} by query: ${JSON.stringify(query)}, error: ${error.message}`);
          return undefined;
        }
      }
    
      async deleteById<T>(id: string, tableName: string): Promise<T | undefined> {
        try {
          // ...existing code...
        } catch (error: any) {
          this.logger.error(`Error deleting ${tableName} by id: ${id}, error: ${error.message}`);
          return undefined;
        }
      }
    
      async delete<T>(query: any, tableName: string): Promise<T | undefined> {
        try {
          // ...existing code...
        } catch (error: any) {
          this.logger.error(`Error deleting ${tableName} by query: ${JSON.stringify(query)}, error: ${error.message}`);
          return undefined;
        }
      }
    
      async findById<T>(id: string, tableName: string): Promise<T | undefined> {
        try {
          // ...existing code...
        } catch (error: any) {
          this.logger.error(`Error finding ${tableName} by id: ${id}, error: ${error.message}`);
          return undefined;
        }
      }
    
      async findOne<T>(query: any, tableName: string): Promise<T | undefined> {
        try {
          // ...existing code...
        } catch (error: any) {
          this.logger.error(`Error finding one ${tableName} by query: ${JSON.stringify(query)}, error: ${error.message}`);
          return undefined;
        }
      }
    
      async find<T>(query: any, tableName: string, options?: FindManyOptions<T>): Promise<T[]> {
        try {
          // ...existing code...
        } catch (error: any) {
          this.logger.error(`Error finding ${tableName} by query: ${JSON.stringify(query)}, error: ${error.message}`);
          return [];
        }
      }
    
      async count(query: any, tableName: string): Promise<number> {
        try {
          // ...existing code...
        } catch (error: any) {
          this.logger.error(`Error counting ${tableName} by query: ${JSON.stringify(query)}, error: ${error.message}`);
          return 0;
        }
      }
}
