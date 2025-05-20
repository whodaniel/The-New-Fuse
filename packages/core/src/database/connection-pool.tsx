// filepath: /Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/packages/core/src/database/connection-pool.tsx
import { Database } from 'sqlite3';
import { promisify } from 'util';
import { ConnectionPoolConfig, DatabaseError } from './types.js';
import { Logger } from '../logging/logger.service.js';

export class ConnectionPool {
    private pool: Database[] = [];
    private activeConnections = new Set<Database>();
    private readonly logger = new Logger(ConnectionPool.name);
    private config: ConnectionPoolConfig;
    private initialized = false;

    constructor(config: ConnectionPoolConfig) {
        this.config = config;
    }

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            // Pre-create connection pool
            for (let i = 0; i < this.config.poolSize; i++) {
                const conn = await this.createConnection();
                this.pool.push(conn);
            }

            this.initialized = true;
            this.logger.log(`Connection pool initialized with ${this.config.poolSize} connections`);
        } catch(error) {
            this.logger.error('Failed to initialize connection pool', error);
            throw error;
        }
    }

    async query<T>(query: string, params: unknown[] = []): Promise<T> {
        if (!this.initialized) {
            throw new Error('Connection pool not initialized');
        }

        const conn = await this.acquire();
        try {
            const result = await this.runQuery<T>(conn, query, params);
            return result;
        } finally {
            await this.release(conn);
        }
    }

    async cleanup(): Promise<void> {
        if (!this.initialized) {
            return;
        }

        try {
            // Close all connections
            const closePromises = [
                ...this.pool.map(conn => this.closeConnection(conn)),
                ...[...this.activeConnections].map(conn => this.closeConnection(conn))
            ];
            
            await Promise.all(closePromises);
            this.pool = [];
            this.activeConnections.clear();
            this.initialized = false;
            
            this.logger.log('Connection pool cleaned up');
        } catch (error) {
            this.logger.error('Error during connection pool cleanup', error);
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    getStats() {
        return {
            total: this.pool.length + this.activeConnections.size,
            active: this.activeConnections.size,
            idle: this.pool.length
        };
    }

    private async acquire(): Promise<Database> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Connection acquisition timeout after ${this.config.timeout}ms`));
            }, this.config.timeout);
        });

        try {
            const conn = await Promise.race([
                this.acquireConnection(),
                timeoutPromise
            ]);
            this.activeConnections.add(conn);
            return conn;
        } catch (error) {
            throw this.wrapError(error);
        }
    }

    private async acquireConnection(): Promise<Database> {
        if(this.pool.length > 0) {
            return this.pool.pop()!;
        }
        
        return this.createConnection();
    }

    private async createConnection(): Promise<Database> {
        return new Promise<Database>((resolve, reject) => {
            const conn = new Database(this.config.databasePath, (err) => {
                if(err) {
                    reject(this.wrapError(err));
                    return;
                }

                // Configure connection
                conn.configure('busyTimeout', 5000);
                
                // Enable WAL mode for better concurrency
                conn.exec('PRAGMA journal_mode=WAL', (err) => {
                    if(err) {
                        reject(this.wrapError(err));
                        return;
                    }
                    resolve(conn);
                });
            });
        });
    }

    private async release(conn: Database): Promise<void> {
        if (this.activeConnections.has(conn)) {
            this.activeConnections.delete(conn);
            if (this.pool.length < this.config.maxIdle) {
                this.pool.push(conn);
            } else {
                await this.closeConnection(conn);
            }
        }
    }

    private async closeConnection(conn: Database): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            conn.close((err) => {
                if(err) {
                    reject(this.wrapError(err));
                    return;
                }
                resolve();
            });
        });
    }

    private async runQuery<T>(
        conn: Database,
        query: string,
        params: unknown[]
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const callback = (err: Error | null, result: T) => {
                if(err) {
                    reject(this.wrapError(err, query, params));
                    return;
                }
                resolve(result);
            };

            if (query.trim().toLowerCase().startsWith('select')) {
                conn.all(query, params, callback);
            } else {
                conn.run(query, params, function(err) {
                    if(err) {
                        callback(err, null as any);
                        return;
                    }
                    callback(null, {
                        lastID: this.lastID,
                        changes: this.changes
                    } as any);
                });
            }
        });
    }

    private wrapError(
        error: unknown,
        query?: string,
        parameters?: unknown[]
    ): DatabaseError {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Assuming DatabaseError is an interface or type that extends Error
        // and includes optional query and parameters properties.
        const dbError = new Error(errorMessage) as DatabaseError;

        if (query !== undefined) {
            dbError.query = query;
        }
        if (parameters !== undefined) {
            dbError.parameters = parameters;
        }

        return dbError;
    }
}
