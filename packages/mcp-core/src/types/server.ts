/**
 * MCP Server type definitions
 */

import { LogLevel, TimeoutConfig, HealthCheckResult } from './common';

/**
 * MCP Server configuration interface
 */
export interface MCPServerConfig {
  /** Server name */
  name: string;
  /** Server version */
  version: string;
  /** Server port */
  port: number;
  /** Server host */
  host: string;
  /** Maximum concurrent connections */
  maxConnections?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable authentication */
  enableAuth?: boolean;
  /** Enable TLS */
  enableTLS?: boolean;
  /** Log level */
  logLevel?: LogLevel;
  /** Timeout configuration */
  timeouts?: TimeoutConfig;
  /** Rate limiting configuration */
  rateLimiting?: {
    enabled: boolean;
    maxRequestsPerMinute: number;
    burstSize: number;
  };
  /** Additional server options */
  options?: ServerOptions;
}

/**
 * Server options interface
 */
export interface ServerOptions {
  /** Enable CORS */
  enableCORS?: boolean;
  /** CORS origins */
  corsOrigins?: string[];
  /** Enable compression */
  enableCompression?: boolean;
  /** Request size limit in bytes */
  requestSizeLimit?: number;
  /** Enable request logging */
  enableRequestLogging?: boolean;
  /** Custom middleware */
  middleware?: any[];
}

/**
 * MCP Server information interface
 */
export interface MCPServerInfo {
  /** Server name */
  name: string;
  /** Server version */
  version: string;
  /** Server description */
  description?: string;
  /** Server capabilities */
  capabilities: string[];
  /** Server status */
  status: 'running' | 'stopped' | 'error';
  /** Server uptime in milliseconds */
  uptime: number;
  /** Number of active connections */
  activeConnections: number;
  /** Server health */
  health: HealthCheckResult;
  /** Server metadata */
  metadata?: Record<string, any>;
}

/**
 * Server statistics interface
 */
export interface ServerStatistics {
  /** Total requests processed */
  totalRequests: number;
  /** Successful requests */
  successfulRequests: number;
  /** Failed requests */
  failedRequests: number;
  /** Average response time in milliseconds */
  averageResponseTime: number;
  /** Requests per second */
  requestsPerSecond: number;
  /** Peak concurrent connections */
  peakConnections: number;
  /** Total data transferred in bytes */
  dataTransferred: number;
  /** Server start time */
  startTime: Date;
  /** Last request time */
  lastRequestTime?: Date;
}
