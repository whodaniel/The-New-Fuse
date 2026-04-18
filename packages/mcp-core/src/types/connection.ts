/**
 * MCP Connection type definitions
 */

// Re-export connection interfaces from the interfaces module
export type {
  ConnectionStatus,
  AuthConfig,
  TLSConfig,
  ConnectionOptions,
  ConnectionMetrics,
  MCPConnection,
  IConnectionManager
} from '../interfaces/IMCPConnection.js';

/**
 * Connection type enumeration
 */
export enum ConnectionType {
  WEBSOCKET = 'websocket',
  HTTP = 'http',
  TCP = 'tcp',
  IPC = 'ipc',
  CUSTOM = 'custom'
}

/**
 * Connection event enumeration
 */
export enum ConnectionEvent {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  RECONNECTING = 'reconnecting',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received'
}

/**
 * Connection pool configuration interface
 */
export interface ConnectionPoolConfig {
  /** Minimum pool size */
  minSize: number;
  /** Maximum pool size */
  maxSize: number;
  /** Connection idle timeout in milliseconds */
  idleTimeout: number;
  /** Connection validation interval in milliseconds */
  validationInterval: number;
  /** Enable connection validation */
  enableValidation: boolean;
  /** Pool growth strategy */
  growthStrategy: 'eager' | 'lazy';
}

/**
 * Connection pool statistics interface
 */
export interface ConnectionPoolStatistics {
  /** Total connections in pool */
  totalConnections: number;
  /** Active connections */
  activeConnections: number;
  /** Idle connections */
  idleConnections: number;
  /** Pool utilization rate (0-1) */
  utilizationRate: number;
  /** Average connection age in milliseconds */
  averageConnectionAge: number;
  /** Pool creation time */
  createdAt: Date;
  /** Last activity timestamp */
  lastActivity?: Date;
}

/**
 * Connection event data interface
 */
export interface ConnectionEventData {
  /** Connection ID */
  connectionId: string;
  /** Event type */
  event: ConnectionEvent;
  /** Event timestamp */
  timestamp: Date;
  /** Event data */
  data?: any;
  /** Error information (if applicable) */
  error?: string;
}

/**
 * Connection health check interface
 */
export interface ConnectionHealthCheck {
  /** Health check ID */
  id: string;
  /** Connection ID */
  connectionId: string;
  /** Health status */
  healthy: boolean;
  /** Response time in milliseconds */
  responseTime: number;
  /** Check timestamp */
  timestamp: Date;
  /** Error message (if unhealthy) */
  error?: string;
  /** Health details */
  details?: Record<string, any>;
}

/**
 * Connection security configuration interface
 */
export interface ConnectionSecurityConfig {
  /** Enable encryption */
  encryption: boolean;
  /** Encryption algorithm */
  encryptionAlgorithm?: string;
  /** Enable message signing */
  signing: boolean;
  /** Signing algorithm */
  signingAlgorithm?: string;
  /** Certificate validation */
  certificateValidation: boolean;
  /** Allowed cipher suites */
  allowedCipherSuites?: string[];
}

/**
 * Connection bandwidth configuration interface
 */
export interface ConnectionBandwidthConfig {
  /** Maximum upload bandwidth in bytes per second */
  maxUpload?: number;
  /** Maximum download bandwidth in bytes per second */
  maxDownload?: number;
  /** Enable bandwidth throttling */
  enableThrottling: boolean;
  /** Burst allowance in bytes */
  burstAllowance?: number;
}

/**
 * Connection monitoring configuration interface
 */
export interface ConnectionMonitoringConfig {
  /** Enable connection monitoring */
  enabled: boolean;
  /** Monitoring interval in milliseconds */
  interval: number;
  /** Enable performance metrics */
  enableMetrics: boolean;
  /** Enable event logging */
  enableEventLogging: boolean;
  /** Log level */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Connection factory interface
 */
export interface ConnectionFactory {
  /**
   * Create a connection
   * @param type Connection type
   * @param endpoint Connection endpoint
   * @param options Connection options
   * @returns Promise resolving to created connection
   */
  createConnection(
    type: ConnectionType,
    endpoint: string,
    options: import('../interfaces/IMCPConnection').ConnectionOptions
  ): Promise<import('../interfaces/IMCPConnection').MCPConnection>;

  /**
   * Get supported connection types
   * @returns Array of supported connection types
   */
  getSupportedTypes(): ConnectionType[];

  /**
   * Validate connection configuration
   * @param type Connection type
   * @param options Connection options
   * @returns Validation result
   */
  validateConfig(type: ConnectionType, options: import('../interfaces/IMCPConnection').ConnectionOptions): boolean;
}