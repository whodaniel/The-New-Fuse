/**
 * Connection Manager for MCP Client
 *
 * Handles connection pooling, lifecycle management, connection reuse,
 * automatic reconnection with exponential backoff, and health monitoring
 * for MCP client connections.
 */

import { EventEmitter } from 'events';
import {
  AuthConfig,
  ConnectionMetrics,
  ConnectionOptions,
  ConnectionStatus,
  IConnectionManager,
  MCPConnection,
} from '../interfaces/IMCPConnection';
import { MCPMessage } from '../interfaces/IMCPMessage';
import { RetryPolicy } from '../types/common';
import { JSONRPCErrorCode, MCPErrorClass, MCPErrorCode } from '../types/error';

/**
 * WebSocket-based MCP Connection implementation
 */
class WebSocketMCPConnection extends EventEmitter implements MCPConnection {
  public readonly id: string;
  public readonly endpoint: string;
  public status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  public lastActivity: Date = new Date();
  public metadata?: Record<string, any>;

  private ws: WebSocket | null = null;
  private connectTime: Date | null = null;
  private bytesTransferred = 0;
  private messagesSent = 0;
  private messagesReceived = 0;

  constructor(endpoint: string, options: ConnectionOptions, metadata?: Record<string, any>) {
    super();
    this.id = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    this.endpoint = endpoint;
    this.metadata = metadata;
  }

  async connect(options: ConnectionOptions): Promise<void> {
    if (this.status === ConnectionStatus.CONNECTED) {
      return;
    }

    this.status = ConnectionStatus.CONNECTING;
    this.connectTime = new Date();

    return new Promise((resolve, reject) => {
      try {
        // Convert HTTP/HTTPS URLs to WebSocket URLs with proper TLS support
        let wsUrl = this.endpoint;
        if (this.endpoint.startsWith('https://')) {
          wsUrl = this.endpoint.replace(/^https:\/\//, 'wss://');
        } else if (this.endpoint.startsWith('http://')) {
          wsUrl = this.endpoint.replace(/^http:\/\//, 'ws://');
        } else if (!this.endpoint.startsWith('ws://') && !this.endpoint.startsWith('wss://')) {
          // Default to secure WebSocket if TLS is enabled
          wsUrl = options.tls?.enabled ? `wss://${this.endpoint}` : `ws://${this.endpoint}`;
        }

        // Check if WebSocket is available (for Node.js environments)
        if (typeof WebSocket === 'undefined') {
          reject(new MCPErrorClass(JSONRPCErrorCode.INTERNAL_ERROR, 'WebSocket not available'));
          return;
        }

        // Prepare WebSocket options for Node.js environments
        const wsOptions: any = {};

        // Add authentication headers
        if (options.auth) {
          wsOptions.headers = this.buildAuthHeaders(options.auth);
        }

        // Add custom headers
        if (options.headers) {
          wsOptions.headers = { ...wsOptions.headers, ...options.headers };
        }

        // Add TLS configuration for Node.js
        if (options.tls && typeof window === 'undefined') {
          wsOptions.rejectUnauthorized = options.tls.rejectUnauthorized ?? true;
          if (options.tls.ca) wsOptions.ca = options.tls.ca;
          if (options.tls.cert) wsOptions.cert = options.tls.cert;
          if (options.tls.key) wsOptions.key = options.tls.key;
          if (options.tls.passphrase) wsOptions.passphrase = options.tls.passphrase;
        }

        // Create WebSocket with options (Node.js) or just URL (browser)
        this.ws =
          typeof window === 'undefined' && Object.keys(wsOptions).length > 0
            ? new WebSocket(wsUrl, wsOptions)
            : new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            this.ws.close();
            this.status = ConnectionStatus.ERROR;
            reject(new MCPErrorClass(MCPErrorCode.CONNECTION_TIMEOUT, 'Connection timeout'));
          }
        }, options.timeout);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.status = ConnectionStatus.CONNECTED;
          this.lastActivity = new Date();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.lastActivity = new Date();
          this.messagesReceived++;
          this.bytesTransferred += event.data.length;

          try {
            const message = JSON.parse(event.data);
            this.emit('message', message);
          } catch (error) {
            this.emit(
              'error',
              new MCPErrorClass(JSONRPCErrorCode.PARSE_ERROR, 'Invalid JSON message')
            );
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          this.status = ConnectionStatus.ERROR;
          this.emit('error', error);
          reject(new MCPErrorClass(MCPErrorCode.CONNECTION_FAILED, 'WebSocket error'));
        };

        this.ws.onclose = () => {
          clearTimeout(timeout);
          if (this.status === ConnectionStatus.CONNECTING) {
            reject(new MCPErrorClass(MCPErrorCode.CONNECTION_FAILED, 'Connection failed'));
          } else {
            this.status = ConnectionStatus.DISCONNECTED;
            this.emit('disconnected');
          }
        };
      } catch (error) {
        this.status = ConnectionStatus.ERROR;
        reject(
          new MCPErrorClass(MCPErrorCode.CONNECTION_FAILED, 'Failed to create WebSocket connection')
        );
      }
    });
  }

  async send(message: MCPMessage): Promise<void> {
    if (!this.isActive()) {
      throw new MCPErrorClass(MCPErrorCode.SERVICE_UNAVAILABLE, 'Connection not active');
    }

    const messageStr = JSON.stringify(message);
    this.ws!.send(messageStr);
    this.messagesSent++;
    this.bytesTransferred += messageStr.length;
    this.lastActivity = new Date();
  }

  async close(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status = ConnectionStatus.DISCONNECTED;
    this.emit('disconnected');
  }

  isActive(): boolean {
    return this.status === ConnectionStatus.CONNECTED && this.ws?.readyState === WebSocket.OPEN;
  }

  getMetrics(): ConnectionMetrics {
    const now = new Date();
    const uptime = this.connectTime ? now.getTime() - this.connectTime.getTime() : 0;

    return {
      totalConnections: 1,
      activeConnections: this.isActive() ? 1 : 0,
      failedConnections: this.status === ConnectionStatus.ERROR ? 1 : 0,
      averageConnectionTime: uptime,
      dataTransferred: this.bytesTransferred,
      lastActivity: this.lastActivity,
      uptime,
    };
  }

  async ping(): Promise<number> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      if (!this.isActive()) {
        reject(new MCPErrorClass(MCPErrorCode.SERVICE_UNAVAILABLE, 'Connection not active'));
        return;
      }

      const pingMessage = {
        jsonrpc: '2.0' as const,
        id: `ping_${Date.now()}`,
        method: 'ping',
        params: {},
      };

      const timeout = setTimeout(() => {
        reject(new MCPErrorClass(MCPErrorCode.CONNECTION_TIMEOUT, 'Ping timeout'));
      }, 5000);

      const onMessage = (message: any) => {
        if (message.id === pingMessage.id) {
          clearTimeout(timeout);
          this.removeListener('message', onMessage);
          resolve(Date.now() - startTime);
        }
      };

      this.on('message', onMessage);
      this.send(pingMessage).catch(reject);
    });
  }

  /**
   * Build authentication headers based on auth configuration
   */
  private buildAuthHeaders(auth: AuthConfig): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (auth.type) {
      case 'bearer':
        if (auth.token) {
          headers['Authorization'] = `Bearer ${auth.token}`;
        }
        break;

      case 'basic':
        if (auth.username && auth.password) {
          const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;

      case 'api_key':
        if (auth.apiKey) {
          headers['X-API-Key'] = auth.apiKey;
        }
        break;

      case 'oauth':
        if (auth.token) {
          headers['Authorization'] = `Bearer ${auth.token}`;
        }
        break;
    }

    // Add any additional auth parameters as headers
    if (auth.additionalParams) {
      Object.entries(auth.additionalParams).forEach(([key, value]) => {
        headers[key] = value;
      });
    }

    return headers;
  }
}

/**
 * Connection health status interface
 */
interface ConnectionHealth {
  endpoint: string;
  isHealthy: boolean;
  lastHealthCheck: Date;
  consecutiveFailures: number;
  averageResponseTime: number;
  lastError?: Error;
}

/**
 * Connection pool configuration interface
 */
interface ConnectionPoolConfig {
  maxConnections: number;
  maxIdleTime: number;
  healthCheckInterval: number;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

/**
 * Enhanced Connection Manager implementation with robust connection pooling,
 * automatic reconnection, and health monitoring
 */
export class ConnectionManager extends EventEmitter implements IConnectionManager {
  private connections = new Map<string, MCPConnection>();
  private connectionOptions = new Map<string, ConnectionOptions>();
  private connectionHealth = new Map<string, ConnectionHealth>();
  private reconnectTimers = new Map<string, NodeJS.Timeout>();
  private healthCheckTimer?: NodeJS.Timeout;
  private poolConfig: ConnectionPoolConfig;
  private isShuttingDown = false;

  constructor(poolConfig?: Partial<ConnectionPoolConfig>) {
    super();

    this.poolConfig = {
      maxConnections: 100,
      maxIdleTime: 300000, // 5 minutes
      healthCheckInterval: 30000, // 30 seconds
      reconnectInterval: 5000, // 5 seconds
      maxReconnectAttempts: 5,
      ...poolConfig,
    };

    // Start health check monitoring
    this.startHealthMonitoring();

    // Handle process shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  async createConnection(endpoint: string, options: ConnectionOptions): Promise<MCPConnection> {
    // Check connection pool limits
    if (this.connections.size >= this.poolConfig.maxConnections) {
      await this.cleanupIdleConnections();

      if (this.connections.size >= this.poolConfig.maxConnections) {
        throw new MCPErrorClass(
          MCPErrorCode.CONNECTION_LIMIT_EXCEEDED,
          'Connection pool limit exceeded'
        );
      }
    }

    // Check if connection already exists and is active
    const existing = this.connections.get(endpoint);
    if (existing && existing.isActive()) {
      return existing;
    }

    // Create new connection
    const connection = new WebSocketMCPConnection(endpoint, options);

    // Set up event handlers
    connection.on('disconnected', () => {
      this.handleConnectionDisconnected(endpoint);
    });

    connection.on('error', (error) => {
      this.handleConnectionError(endpoint, error);
    });

    // Connect with retry logic
    await this.connectWithRetry(connection, options);

    // Store connection and options
    this.connections.set(endpoint, connection);
    this.connectionOptions.set(endpoint, options);

    // Initialize health tracking
    this.connectionHealth.set(endpoint, {
      endpoint,
      isHealthy: true,
      lastHealthCheck: new Date(),
      consecutiveFailures: 0,
      averageResponseTime: 0,
    });

    this.emit('connectionCreated', endpoint);
    return connection;
  }

  private async connectWithRetry(
    connection: WebSocketMCPConnection,
    options: ConnectionOptions
  ): Promise<void> {
    const retryPolicy: RetryPolicy = {
      maxAttempts: options.retryAttempts,
      baseDelay: options.retryDelay,
      maxDelay: 30000, // 30 seconds max
      backoffMultiplier: 2,
      jitter: 0.1,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryPolicy.maxAttempts; attempt++) {
      try {
        await connection.connect(options);
        return;
      } catch (error) {
        lastError = error as Error;

        if (attempt < retryPolicy.maxAttempts) {
          // Calculate delay with exponential backoff and jitter
          const baseDelay = Math.min(
            retryPolicy.baseDelay * Math.pow(retryPolicy.backoffMultiplier || 2, attempt),
            retryPolicy.maxDelay
          );

          const jitter = retryPolicy.jitter
            ? (Math.random() * 2 - 1) * retryPolicy.jitter * baseDelay
            : 0;

          const delay = Math.max(0, baseDelay + jitter);

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw (
      lastError ||
      new MCPErrorClass(MCPErrorCode.CONNECTION_FAILED, 'Failed to connect after retries')
    );
  }

  getConnection(endpoint: string): MCPConnection | null {
    return this.connections.get(endpoint) || null;
  }

  async closeConnection(endpoint: string): Promise<void> {
    const connection = this.connections.get(endpoint);
    if (connection) {
      // Clear any reconnect timer
      const timer = this.reconnectTimers.get(endpoint);
      if (timer) {
        clearTimeout(timer);
        this.reconnectTimers.delete(endpoint);
      }

      await connection.close();
      this.connections.delete(endpoint);
      this.connectionOptions.delete(endpoint);
      this.connectionHealth.delete(endpoint);
      this.emit('connectionClosed', endpoint);
    }
  }

  getConnectionStatus(endpoint: string): ConnectionStatus {
    const connection = this.connections.get(endpoint);
    return connection ? connection.status : ConnectionStatus.DISCONNECTED;
  }

  getConnectionMetrics(): ConnectionMetrics {
    const connections = Array.from(this.connections.values());

    if (connections.length === 0) {
      return {
        totalConnections: 0,
        activeConnections: 0,
        failedConnections: 0,
        averageConnectionTime: 0,
        dataTransferred: 0,
        lastActivity: new Date(),
        uptime: 0,
      };
    }

    const metrics = connections.map((conn) => conn.getMetrics());

    return {
      totalConnections: metrics.reduce((sum, m) => sum + m.totalConnections, 0),
      activeConnections: metrics.reduce((sum, m) => sum + m.activeConnections, 0),
      failedConnections: metrics.reduce((sum, m) => sum + m.failedConnections, 0),
      averageConnectionTime:
        metrics.reduce((sum, m) => sum + m.averageConnectionTime, 0) / metrics.length,
      dataTransferred: metrics.reduce((sum, m) => sum + m.dataTransferred, 0),
      lastActivity: new Date(Math.max(...metrics.map((m) => m.lastActivity.getTime()))),
      uptime: metrics.reduce((sum, m) => sum + m.uptime, 0) / metrics.length,
    };
  }

  listConnections(): MCPConnection[] {
    return Array.from(this.connections.values());
  }

  async closeAllConnections(): Promise<void> {
    this.isShuttingDown = true;

    // Clear health check timer
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    // Clear all reconnect timers
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();

    const closePromises = Array.from(this.connections.keys()).map((endpoint) =>
      this.closeConnection(endpoint)
    );

    await Promise.all(closePromises);
  }

  /**
   * Cleanup inactive connections
   */
  async cleanupInactiveConnections(): Promise<void> {
    const inactiveEndpoints: string[] = [];

    for (const [endpoint, connection] of this.connections) {
      if (!connection.isActive()) {
        inactiveEndpoints.push(endpoint);
      }
    }

    for (const endpoint of inactiveEndpoints) {
      await this.closeConnection(endpoint);
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStatistics() {
    const connections = Array.from(this.connections.values());
    const healthStats = Array.from(this.connectionHealth.values());

    return {
      totalConnections: connections.length,
      activeConnections: connections.filter((c) => c.isActive()).length,
      inactiveConnections: connections.filter((c) => !c.isActive()).length,
      healthyConnections: healthStats.filter((h) => h.isHealthy).length,
      unhealthyConnections: healthStats.filter((h) => !h.isHealthy).length,
      endpoints: Array.from(this.connections.keys()),
      poolConfig: this.poolConfig,
    };
  }

  /**
   * Handle connection disconnection with automatic reconnection
   */
  private handleConnectionDisconnected(endpoint: string): void {
    const health = this.connectionHealth.get(endpoint);
    if (health) {
      health.isHealthy = false;
      health.consecutiveFailures++;
    }

    this.emit('connectionClosed', endpoint);

    // Attempt automatic reconnection if not shutting down
    if (!this.isShuttingDown) {
      this.scheduleReconnection(endpoint);
    }
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(endpoint: string, error: any): void {
    const health = this.connectionHealth.get(endpoint);
    if (health) {
      health.isHealthy = false;
      health.consecutiveFailures++;
      health.lastError = error;
    }

    this.emit('connectionError', endpoint, error);
  }

  /**
   * Schedule automatic reconnection for a disconnected endpoint
   */
  private scheduleReconnection(endpoint: string): void {
    const options = this.connectionOptions.get(endpoint);
    const health = this.connectionHealth.get(endpoint);

    if (!options || !health) {
      return;
    }

    // Don't reconnect if we've exceeded max attempts
    if (health.consecutiveFailures >= this.poolConfig.maxReconnectAttempts) {
      this.emit('reconnectionAbandoned', endpoint, health.consecutiveFailures);
      return;
    }

    // Clear any existing timer
    const existingTimer = this.reconnectTimers.get(endpoint);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Calculate reconnection delay with exponential backoff
    const baseDelay = this.poolConfig.reconnectInterval;
    const delay = Math.min(
      baseDelay * Math.pow(2, health.consecutiveFailures - 1),
      60000 // Max 1 minute
    );

    const timer = setTimeout(async () => {
      try {
        this.reconnectTimers.delete(endpoint);

        // Remove old connection
        const oldConnection = this.connections.get(endpoint);
        if (oldConnection) {
          await oldConnection.close();
        }

        // Create new connection
        const connection = new WebSocketMCPConnection(endpoint, options);

        // Set up event handlers
        connection.on('disconnected', () => {
          this.handleConnectionDisconnected(endpoint);
        });

        connection.on('error', (error) => {
          this.handleConnectionError(endpoint, error);
        });

        // Attempt to connect
        await this.connectWithRetry(connection, options);

        // Update connection and health status
        this.connections.set(endpoint, connection);
        if (health) {
          health.isHealthy = true;
          health.consecutiveFailures = 0;
          health.lastHealthCheck = new Date();
          health.lastError = undefined;
        }

        this.emit('connectionReconnected', endpoint);
      } catch (error) {
        this.emit('reconnectionFailed', endpoint, error);

        // Schedule another reconnection attempt
        if (health.consecutiveFailures < this.poolConfig.maxReconnectAttempts) {
          this.scheduleReconnection(endpoint);
        }
      }
    }, delay);

    this.reconnectTimers.set(endpoint, timer);
    this.emit('reconnectionScheduled', endpoint, delay);
  }

  /**
   * Start health monitoring for all connections
   */
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.poolConfig.healthCheckInterval);
  }

  /**
   * Perform health checks on all connections
   */
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.connections.entries()).map(
      async ([endpoint, connection]) => {
        const health = this.connectionHealth.get(endpoint);
        if (!health) return;

        try {
          if (connection.isActive()) {
            const startTime = Date.now();
            await connection.ping();
            const responseTime = Date.now() - startTime;

            // Update health status
            health.isHealthy = true;
            health.lastHealthCheck = new Date();
            health.consecutiveFailures = 0;
            health.averageResponseTime = (health.averageResponseTime + responseTime) / 2;
            health.lastError = undefined;
          } else {
            health.isHealthy = false;
            health.consecutiveFailures++;
          }
        } catch (error) {
          health.isHealthy = false;
          health.consecutiveFailures++;
          health.lastError = error as Error;
          health.lastHealthCheck = new Date();
        }
      }
    );

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Clean up idle connections that haven't been used recently
   */
  private async cleanupIdleConnections(): Promise<void> {
    const now = Date.now();
    const idleEndpoints: string[] = [];

    for (const [endpoint, connection] of this.connections) {
      const timeSinceLastActivity = now - connection.lastActivity.getTime();

      if (timeSinceLastActivity > this.poolConfig.maxIdleTime && !connection.isActive()) {
        idleEndpoints.push(endpoint);
      }
    }

    // Close idle connections
    for (const endpoint of idleEndpoints) {
      await this.closeConnection(endpoint);
      this.emit('connectionIdleCleanup', endpoint);
    }
  }

  /**
   * Get health status for a specific connection
   */
  getConnectionHealth(endpoint: string): ConnectionHealth | null {
    return this.connectionHealth.get(endpoint) || null;
  }

  /**
   * Get health status for all connections
   */
  getAllConnectionHealth(): ConnectionHealth[] {
    return Array.from(this.connectionHealth.values());
  }

  /**
   * Force a health check for a specific connection
   */
  async checkConnectionHealth(endpoint: string): Promise<boolean> {
    const connection = this.connections.get(endpoint);
    const health = this.connectionHealth.get(endpoint);

    if (!connection || !health) {
      return false;
    }

    try {
      if (connection.isActive()) {
        const startTime = Date.now();
        await connection.ping();
        const responseTime = Date.now() - startTime;

        health.isHealthy = true;
        health.lastHealthCheck = new Date();
        health.consecutiveFailures = 0;
        health.averageResponseTime = (health.averageResponseTime + responseTime) / 2;
        health.lastError = undefined;

        return true;
      } else {
        health.isHealthy = false;
        health.consecutiveFailures++;
        return false;
      }
    } catch (error) {
      health.isHealthy = false;
      health.consecutiveFailures++;
      health.lastError = error as Error;
      health.lastHealthCheck = new Date();
      return false;
    }
  }

  /**
   * Graceful shutdown of the connection manager
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    await this.closeAllConnections();
    this.emit('shutdown');
  }

  /**
   * Get detailed connection statistics
   */
  getDetailedStatistics() {
    const connections = Array.from(this.connections.values());
    const healthStats = Array.from(this.connectionHealth.values());

    const totalResponseTime = healthStats.reduce((sum, h) => sum + h.averageResponseTime, 0);
    const healthyConnections = healthStats.filter((h) => h.isHealthy);

    return {
      pool: {
        totalConnections: connections.length,
        activeConnections: connections.filter((c) => c.isActive()).length,
        healthyConnections: healthyConnections.length,
        maxConnections: this.poolConfig.maxConnections,
        utilizationPercentage: (connections.length / this.poolConfig.maxConnections) * 100,
      },
      performance: {
        averageResponseTime: healthStats.length > 0 ? totalResponseTime / healthStats.length : 0,
        totalFailures: healthStats.reduce((sum, h) => sum + h.consecutiveFailures, 0),
        reconnectionAttempts: this.reconnectTimers.size,
      },
      health: {
        healthyPercentage:
          connections.length > 0 ? (healthyConnections.length / connections.length) * 100 : 0,
        unhealthyConnections: healthStats.filter((h) => !h.isHealthy).length,
        lastHealthCheck:
          healthStats.length > 0
            ? new Date(Math.max(...healthStats.map((h) => h.lastHealthCheck.getTime())))
            : null,
      },
    };
  }

  /**
   * Get security metrics for connections
   */
  getSecurityMetrics() {
    const connections = Array.from(this.connections.values());
    const options = Array.from(this.connectionOptions.values());

    const tlsConnections = options.filter((opt) => opt.tls?.enabled).length;
    const authenticatedConnections = options.filter((opt) => opt.auth).length;
    const authTypes = options
      .filter((opt) => opt.auth)
      .map((opt) => opt.auth!.type)
      .reduce(
        (acc, type) => {
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    return {
      security: {
        tlsEnabled: tlsConnections,
        tlsPercentage: connections.length > 0 ? (tlsConnections / connections.length) * 100 : 0,
        authenticatedConnections,
        authenticationPercentage:
          connections.length > 0 ? (authenticatedConnections / connections.length) * 100 : 0,
        authenticationTypes: authTypes,
      },
      compliance: {
        secureConnections: options.filter((opt) => opt.tls?.enabled && opt.auth).length,
        insecureConnections: options.filter((opt) => !opt.tls?.enabled || !opt.auth).length,
      },
    };
  }

  /**
   * Get performance metrics over time
   */
  getPerformanceMetrics() {
    const connections = Array.from(this.connections.values());
    const healthStats = Array.from(this.connectionHealth.values());

    const now = Date.now();
    const metrics = connections.map((conn) => conn.getMetrics());

    return {
      throughput: {
        totalDataTransferred: metrics.reduce((sum, m) => sum + m.dataTransferred, 0),
        averageDataPerConnection:
          metrics.length > 0
            ? metrics.reduce((sum, m) => sum + m.dataTransferred, 0) / metrics.length
            : 0,
      },
      latency: {
        averageResponseTime:
          healthStats.length > 0
            ? healthStats.reduce((sum, h) => sum + h.averageResponseTime, 0) / healthStats.length
            : 0,
        minResponseTime:
          healthStats.length > 0 ? Math.min(...healthStats.map((h) => h.averageResponseTime)) : 0,
        maxResponseTime:
          healthStats.length > 0 ? Math.max(...healthStats.map((h) => h.averageResponseTime)) : 0,
      },
      reliability: {
        uptime:
          metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.uptime, 0) / metrics.length : 0,
        successRate:
          healthStats.length > 0
            ? (healthStats.filter((h) => h.isHealthy).length / healthStats.length) * 100
            : 0,
        failureRate:
          healthStats.length > 0
            ? (healthStats.filter((h) => !h.isHealthy).length / healthStats.length) * 100
            : 0,
      },
    };
  }
}
