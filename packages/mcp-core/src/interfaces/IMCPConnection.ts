/**
 * MCP Connection interfaces for managing connections in the MCP protocol
 */

import { EventEmitter } from 'events';
import { MCPMessage } from './IMCPMessage.js';

/**
 * Connection status enumeration
 */
export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  RECONNECTING = 'reconnecting'
}

/**
 * Authentication configuration interface
 */
export interface AuthConfig {
  /** Authentication type */
  type: 'bearer' | 'basic' | 'oauth' | 'api_key';
  /** Bearer token */
  token?: string;
  /** Basic auth username */
  username?: string;
  /** Basic auth password */
  password?: string;
  /** API key */
  apiKey?: string;
  /** OAuth client ID */
  clientId?: string;
  /** OAuth client secret */
  clientSecret?: string;
  /** Additional auth parameters */
  additionalParams?: Record<string, string>;
}

/**
 * TLS configuration interface
 */
export interface TLSConfig {
  /** Enable TLS */
  enabled: boolean;
  /** Reject unauthorized certificates */
  rejectUnauthorized?: boolean;
  /** CA certificate */
  ca?: string;
  /** Client certificate */
  cert?: string;
  /** Client private key */
  key?: string;
  /** Passphrase for private key */
  passphrase?: string;
}

/**
 * Connection options interface
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
 * Connection metrics interface
 */
export interface ConnectionMetrics {
  /** Total number of connections */
  totalConnections: number;
  /** Number of active connections */
  activeConnections: number;
  /** Number of failed connections */
  failedConnections: number;
  /** Average connection time in milliseconds */
  averageConnectionTime: number;
  /** Total data transferred in bytes */
  dataTransferred: number;
  /** Last activity timestamp */
  lastActivity: Date;
  /** Connection uptime in milliseconds */
  uptime: number;
}

/**
 * MCP Connection interface
 */
export interface MCPConnection extends EventEmitter {
  /** Unique connection identifier */
  id: string;
  /** Connection endpoint URL */
  endpoint: string;
  /** Current connection status */
  status: ConnectionStatus;
  /** Last activity timestamp */
  lastActivity: Date;
  /** Connection metadata */
  metadata?: Record<string, any>;

  /**
   * Send a message through the connection
   * @param message The message to send
   */
  send(message: MCPMessage): Promise<void>;

  /**
   * Close the connection
   */
  close(): Promise<void>;

  /**
   * Check if the connection is active
   * @returns True if connection is active, false otherwise
   */
  isActive(): boolean;

  /**
   * Get connection metrics
   * @returns Connection metrics
   */
  getMetrics(): ConnectionMetrics;

  /**
   * Ping the connection to check if it's alive
   * @returns Promise resolving to ping response time in milliseconds
   */
  ping(): Promise<number>;
}

/**
 * Connection manager interface
 */
export interface IConnectionManager {
  /**
   * Create a new connection
   * @param endpoint The endpoint to connect to
   * @param options Connection options
   * @returns Promise resolving to the created connection
   */
  createConnection(endpoint: string, options: ConnectionOptions): Promise<MCPConnection>;

  /**
   * Get an existing connection
   * @param endpoint The endpoint to get connection for
   * @returns The connection if it exists, null otherwise
   */
  getConnection(endpoint: string): MCPConnection | null;

  /**
   * Close a connection
   * @param endpoint The endpoint to close connection for
   */
  closeConnection(endpoint: string): Promise<void>;

  /**
   * Get connection status
   * @param endpoint The endpoint to check status for
   * @returns The connection status
   */
  getConnectionStatus(endpoint: string): ConnectionStatus;

  /**
   * Get connection metrics for all connections
   * @returns Aggregated connection metrics
   */
  getConnectionMetrics(): ConnectionMetrics;

  /**
   * List all active connections
   * @returns Array of active connections
   */
  listConnections(): MCPConnection[];

  /**
   * Close all connections
   */
  closeAllConnections(): Promise<void>;
}