/**
 * Connection Pool Optimization System
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';

/**
 * Connection pool configuration
 */
export interface ConnectionPoolConfig {
  /** Minimum pool size */
  minSize: number;
  /** Maximum pool size */
  maxSize: number;
  /** Connection timeout (ms) */
  connectionTimeout: number;
  /** Idle timeout (ms) */
  idleTimeout: number;
  /** Maximum wait time for connection (ms) */
  maxWaitTime: number;
  /** Health check interval (ms) */
  healthCheckInterval: number;
  /** Enable connection validation */
  validateConnections: boolean;
  /** Connection retry attempts */
  retryAttempts: number;
  /** Retry delay (ms) */
  retryDelay: number;
}

/**
 * Connection interface
 */
export interface IConnection {
  /** Connection ID */
  id: string;
  /** Connection status */
  status: 'idle' | 'active' | 'invalid';
  /** Creation timestamp */
  createdAt: Date;
  /** Last used timestamp */
  lastUsed: Date;
  /** Usage count */
  usageCount: number;
  /** Connect to target */
  connect(): Promise<void>;
  /** Disconnect */
  disconnect(): Promise<void>;
  /** Check if connection is healthy */
  isHealthy(): Promise<boolean>;
  /** Execute operation */
  execute<T>(operation: () => Promise<T>): Promise<T>;
}

/**
 * Connection factory interface
 */
export interface IConnectionFactory<T extends IConnection> {
  /** Create new connection */
  createConnection(): Promise<T>;
  /** Validate connection */
  validateConnection(connection: T): Promise<boolean>;
}

/**
 * Pool statistics
 */
export interface PoolStatistics {
  /** Total connections */
  totalConnections: number;
  /** Active connections */
  activeConnections: number;
  /** Idle connections */
  idleConnections: number;
  /** Invalid connections */
  invalidConnections: number;
  /** Pending requests */
  pendingRequests: number;
  /** Total requests served */
  totalRequests: number;
  /** Average wait time */
  averageWaitTime: number;
  /** Pool utilization rate */
  utilizationRate: number;
}

/**
 * Optimized connection pool implementation
 */
export class OptimizedConnectionPool<T extends IConnection> extends EventEmitter {
  private readonly config: ConnectionPoolConfig;
  private readonly factory: IConnectionFactory<T>;
  private readonly logger: Logger;
  
  private readonly connections = new Set<T>();
  private readonly idleConnections = new Set<T>();
  private readonly activeConnections = new Set<T>();
  private readonly pendingRequests: Array<{
    resolve: (connection: T) => void;
    reject: (error: Error) => void;
    timestamp: Date;
  }> = [];
  
  private healthCheckTimer?: NodeJS.Timeout;
  private optimizationTimer?: NodeJS.Timeout;
  private running = false;
  
  // Statistics
  private stats = {
    totalRequests: 0,
    totalWaitTime: 0,
    connectionsCreated: 0,
    connectionsDestroyed: 0
  };

  constructor(
    config: ConnectionPoolConfig,
    factory: IConnectionFactory<T>,
    logger?: Logger
  ) {
    super();
    this.config = config;
    this.factory = factory;
    this.logger = logger || new Logger('ConnectionPool');
  }

  /**
   * Initialize the connection pool
   */
  async initialize(): Promise<void> {
    if (this.running) {
      this.logger.warn('Connection pool is already running');
      return;
    }

    this.logger.info('Initializing connection pool', {
      minSize: this.config.minSize,
      maxSize: this.config.maxSize
    });

    this.running = true;

    // Create minimum connections
    await this.ensureMinimumConnections();

    // Start health checks
    this.startHealthChecks();

    // Start optimization
    this.startOptimization();

    this.logger.info('Connection pool initialized');
    this.emit('initialized');
  }

  /**
   * Shutdown the connection pool
   */
  async shutdown(): Promise<void> {
    if (!this.running) {
      this.logger.warn('Connection pool is not running');
      return;
    }

    this.logger.info('Shutting down connection pool');

    this.running = false;

    // Stop timers
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = undefined;
    }

    // Reject pending requests
    for (const request of this.pendingRequests) {
      request.reject(new Error('Connection pool is shutting down'));
    }
    this.pendingRequests.length = 0;

    // Close all connections
    const closePromises = Array.from(this.connections).map(async (connection) => {
      try {
        await connection.disconnect();
      } catch (error) {
        this.logger.error(`Error closing connection ${connection.id}:`, error);
      }
    });

    await Promise.all(closePromises);

    this.connections.clear();
    this.idleConnections.clear();
    this.activeConnections.clear();

    this.logger.info('Connection pool shutdown complete');
    this.emit('shutdown');
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<T> {
    if (!this.running) {
      throw new Error('Connection pool is not running');
    }

    const startTime = Date.now();
    this.stats.totalRequests++;

    // Try to get an idle connection
    const idleConnection = this.getIdleConnection();
    if (idleConnection) {
      this.moveToActive(idleConnection);
      this.recordWaitTime(Date.now() - startTime);
      return idleConnection;
    }

    // Try to create a new connection if under limit
    if (this.connections.size < this.config.maxSize) {
      try {
        const newConnection = await this.createConnection();
        this.moveToActive(newConnection);
        this.recordWaitTime(Date.now() - startTime);
        return newConnection;
      } catch (error) {
        this.logger.error('Failed to create new connection:', error);
      }
    }

    // Wait for a connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.pendingRequests.findIndex(req => req.resolve === resolve);
        if (index >= 0) {
          this.pendingRequests.splice(index, 1);
        }
        reject(new Error('Connection acquisition timeout'));
      }, this.config.maxWaitTime);

      this.pendingRequests.push({
        resolve: (connection: T) => {
          clearTimeout(timeout);
          this.recordWaitTime(Date.now() - startTime);
          resolve(connection);
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: new Date()
      });
    });
  }

  /**
   * Release a connection back to the pool
   */
  async release(connection: T): Promise<void> {
    if (!this.activeConnections.has(connection)) {
      this.logger.warn(`Attempting to release connection not in active set: ${connection.id}`);
      return;
    }

    // Update connection info
    connection.lastUsed = new Date();
    connection.usageCount++;

    // Check if connection is still healthy
    if (this.config.validateConnections) {
      try {
        const isHealthy = await connection.isHealthy();
        if (!isHealthy) {
          await this.destroyConnection(connection);
          return;
        }
      } catch (error) {
        this.logger.error(`Health check failed for connection ${connection.id}:`, error);
        await this.destroyConnection(connection);
        return;
      }
    }

    // Serve pending request if any
    const pendingRequest = this.pendingRequests.shift();
    if (pendingRequest) {
      pendingRequest.resolve(connection);
      return;
    }

    // Move to idle
    this.moveToIdle(connection);
  }

  /**
   * Get pool statistics
   */
  getStatistics(): PoolStatistics {
    const totalConnections = this.connections.size;
    const activeConnections = this.activeConnections.size;
    const idleConnections = this.idleConnections.size;
    const invalidConnections = totalConnections - activeConnections - idleConnections;
    const pendingRequests = this.pendingRequests.length;
    const averageWaitTime = this.stats.totalRequests > 0 ? 
      this.stats.totalWaitTime / this.stats.totalRequests : 0;
    const utilizationRate = totalConnections > 0 ? activeConnections / totalConnections : 0;

    return {
      totalConnections,
      activeConnections,
      idleConnections,
      invalidConnections,
      pendingRequests,
      totalRequests: this.stats.totalRequests,
      averageWaitTime,
      utilizationRate
    };
  }

  /**
   * Optimize pool size based on usage patterns
   */
  async optimizePoolSize(): Promise<void> {
    const stats = this.getStatistics();
    const currentTime = Date.now();

    // Scale up if utilization is high and there are pending requests
    if (stats.utilizationRate > 0.8 && stats.pendingRequests > 0) {
      const targetSize = Math.min(
        this.config.maxSize,
        stats.totalConnections + Math.ceil(stats.pendingRequests / 2)
      );

      if (targetSize > stats.totalConnections) {
        this.logger.info(`Scaling up pool from ${stats.totalConnections} to ${targetSize}`);
        await this.scaleUp(targetSize - stats.totalConnections);
      }
    }

    // Scale down if utilization is low
    if (stats.utilizationRate < 0.3 && stats.totalConnections > this.config.minSize) {
      const idleTime = this.config.idleTimeout;
      const connectionsToRemove: T[] = [];

      for (const connection of this.idleConnections) {
        const timeSinceLastUse = currentTime - connection.lastUsed.getTime();
        if (timeSinceLastUse > idleTime && 
            stats.totalConnections - connectionsToRemove.length > this.config.minSize) {
          connectionsToRemove.push(connection);
        }
      }

      if (connectionsToRemove.length > 0) {
        this.logger.info(`Scaling down pool by ${connectionsToRemove.length} connections`);
        for (const connection of connectionsToRemove) {
          await this.destroyConnection(connection);
        }
      }
    }
  }

  /**
   * Get an idle connection
   */
  private getIdleConnection(): T | null {
    for (const connection of this.idleConnections) {
      if (connection.status === 'idle') {
        return connection;
      }
    }
    return null;
  }

  /**
   * Create a new connection
   */
  private async createConnection(): Promise<T> {
    this.logger.debug('Creating new connection');
    
    const connection = await this.factory.createConnection();
    await connection.connect();
    
    this.connections.add(connection);
    this.stats.connectionsCreated++;
    
    this.logger.debug(`Created connection ${connection.id}`);
    this.emit('connectionCreated', connection);
    
    return connection;
  }

  /**
   * Destroy a connection
   */
  private async destroyConnection(connection: T): Promise<void> {
    this.logger.debug(`Destroying connection ${connection.id}`);
    
    this.connections.delete(connection);
    this.idleConnections.delete(connection);
    this.activeConnections.delete(connection);
    
    try {
      await connection.disconnect();
    } catch (error) {
      this.logger.error(`Error disconnecting connection ${connection.id}:`, error);
    }
    
    this.stats.connectionsDestroyed++;
    this.emit('connectionDestroyed', connection);
  }

  /**
   * Move connection to active set
   */
  private moveToActive(connection: T): void {
    this.idleConnections.delete(connection);
    this.activeConnections.add(connection);
    connection.status = 'active';
  }

  /**
   * Move connection to idle set
   */
  private moveToIdle(connection: T): void {
    this.activeConnections.delete(connection);
    this.idleConnections.add(connection);
    connection.status = 'idle';
  }

  /**
   * Ensure minimum connections
   */
  private async ensureMinimumConnections(): Promise<void> {
    const needed = this.config.minSize - this.connections.size;
    if (needed <= 0) return;

    this.logger.debug(`Creating ${needed} connections to reach minimum pool size`);
    
    const createPromises: Promise<void>[] = [];
    for (let i = 0; i < needed; i++) {
      createPromises.push(
        this.createConnection()
          .then(connection => this.moveToIdle(connection))
          .catch(error => {
            this.logger.error('Failed to create minimum connection:', error);
          })
      );
    }

    await Promise.all(createPromises);
  }

  /**
   * Scale up the pool
   */
  private async scaleUp(count: number): Promise<void> {
    const createPromises: Promise<void>[] = [];
    
    for (let i = 0; i < count; i++) {
      createPromises.push(
        this.createConnection()
          .then(connection => {
            // Serve pending request if any
            const pendingRequest = this.pendingRequests.shift();
            if (pendingRequest) {
              this.moveToActive(connection);
              pendingRequest.resolve(connection);
            } else {
              this.moveToIdle(connection);
            }
          })
          .catch(error => {
            this.logger.error('Failed to scale up connection:', error);
          })
      );
    }

    await Promise.all(createPromises);
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on idle connections
   */
  private async performHealthChecks(): Promise<void> {
    if (!this.config.validateConnections) return;

    const healthCheckPromises: Promise<void>[] = [];
    
    for (const connection of this.idleConnections) {
      healthCheckPromises.push(
        connection.isHealthy()
          .then(isHealthy => {
            if (!isHealthy) {
              return this.destroyConnection(connection);
            }
          })
          .catch(error => {
            this.logger.error(`Health check failed for connection ${connection.id}:`, error);
            return this.destroyConnection(connection);
          })
      );
    }

    await Promise.all(healthCheckPromises);
  }

  /**
   * Start optimization
   */
  private startOptimization(): void {
    this.optimizationTimer = setInterval(async () => {
      await this.optimizePoolSize();
    }, 30000); // Every 30 seconds
  }

  /**
   * Record wait time for statistics
   */
  private recordWaitTime(waitTime: number): void {
    this.stats.totalWaitTime += waitTime;
  }
}

/**
 * Connection pool factory
 */
export class ConnectionPoolFactory {
  /**
   * Create optimized connection pool
   */
  static createOptimizedPool<T extends IConnection>(
    factory: IConnectionFactory<T>,
    config: Partial<ConnectionPoolConfig> = {}
  ): OptimizedConnectionPool<T> {
    const defaultConfig: ConnectionPoolConfig = {
      minSize: 5,
      maxSize: 50,
      connectionTimeout: 30000,
      idleTimeout: 300000, // 5 minutes
      maxWaitTime: 10000,
      healthCheckInterval: 60000, // 1 minute
      validateConnections: true,
      retryAttempts: 3,
      retryDelay: 1000
    };

    return new OptimizedConnectionPool(
      { ...defaultConfig, ...config },
      factory
    );
  }

  /**
   * Create high-throughput pool
   */
  static createHighThroughputPool<T extends IConnection>(
    factory: IConnectionFactory<T>
  ): OptimizedConnectionPool<T> {
    return this.createOptimizedPool(factory, {
      minSize: 10,
      maxSize: 100,
      connectionTimeout: 15000,
      idleTimeout: 180000, // 3 minutes
      maxWaitTime: 5000,
      healthCheckInterval: 30000, // 30 seconds
      validateConnections: true
    });
  }

  /**
   * Create resource-efficient pool
   */
  static createResourceEfficientPool<T extends IConnection>(
    factory: IConnectionFactory<T>
  ): OptimizedConnectionPool<T> {
    return this.createOptimizedPool(factory, {
      minSize: 2,
      maxSize: 20,
      connectionTimeout: 60000,
      idleTimeout: 600000, // 10 minutes
      maxWaitTime: 15000,
      healthCheckInterval: 120000, // 2 minutes
      validateConnections: true
    });
  }
}