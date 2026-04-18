/**
 * MCP Client type definitions
 */

import { AuthConfig, TLSConfig, ConnectionStatus } from '../interfaces/IMCPConnection.js';
import { RetryPolicy, TimeoutConfig } from './common.js';

/**
 * MCP Client configuration interface
 */
export interface MCPClientConfig {
  /** Client name */
  name: string;
  /** Client version */
  version: string;
  /** Default timeout in milliseconds */
  timeout: number;
  /** Retry policy */
  retryPolicy: RetryPolicy;
  /** Timeout configuration */
  timeouts?: TimeoutConfig;
  /** Client options */
  options?: ClientOptions;
}

/**
 * Client options interface
 */
export interface ClientOptions {
  /** Enable automatic reconnection */
  autoReconnect?: boolean;
  /** Reconnection interval in milliseconds */
  reconnectInterval?: number;
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
  /** Enable request queuing during disconnection */
  enableRequestQueuing?: boolean;
  /** Maximum queue size */
  maxQueueSize?: number;
  /** Enable response caching */
  enableCaching?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
}

/**
 * Connection options interface (re-exported for convenience)
 */
export interface ConnectionOptions {
  /** Connection timeout in milliseconds */
  timeout: number;
  /** Number of retry attempts */
  retryAttempts: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
  /** Enable keep-alive */
  keepAlive: boolean;
  /** Authentication configuration */
  auth?: AuthConfig;
  /** TLS configuration */
  tls?: TLSConfig;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Connection metadata */
  metadata?: Record<string, any>;
}

/**
 * Client statistics interface
 */
export interface ClientStatistics {
  /** Total requests sent */
  totalRequests: number;
  /** Successful requests */
  successfulRequests: number;
  /** Failed requests */
  failedRequests: number;
  /** Average response time in milliseconds */
  averageResponseTime: number;
  /** Total connections made */
  totalConnections: number;
  /** Active connections */
  activeConnections: number;
  /** Connection failures */
  connectionFailures: number;
  /** Total data sent in bytes */
  dataSent: number;
  /** Total data received in bytes */
  dataReceived: number;
  /** Client start time */
  startTime: Date;
  /** Last request time */
  lastRequestTime?: Date;
}

/**
 * Client status interface
 */
export interface ClientStatus {
  /** Client name */
  name: string;
  /** Connection status */
  connectionStatus: ConnectionStatus;
  /** Connected endpoint */
  endpoint?: string;
  /** Last activity timestamp */
  lastActivity?: Date;
  /** Error message if any */
  error?: string;
  /** Client statistics */
  statistics: ClientStatistics;
}