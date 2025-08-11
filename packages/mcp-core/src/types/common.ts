/**
 * Common types used throughout the MCP system
 */

/**
 * Log level enumeration
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

/**
 * Service status enumeration
 */
export enum ServiceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  DEGRADED = 'degraded',
  MAINTENANCE = 'maintenance'
}

/**
 * Load balancing strategy enumeration
 */
export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round_robin',
  LEAST_CONNECTIONS = 'least_connections',
  WEIGHTED = 'weighted',
  RANDOM = 'random'
}

/**
 * Retry policy interface
 */
export interface RetryPolicy {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Jitter factor (0-1) */
  jitter?: number;
}

/**
 * Timeout configuration interface
 */
export interface TimeoutConfig {
  /** Connection timeout in milliseconds */
  connection?: number;
  /** Request timeout in milliseconds */
  request?: number;
  /** Response timeout in milliseconds */
  response?: number;
  /** Idle timeout in milliseconds */
  idle?: number;
}

/**
 * Generic callback function type
 */
export type Callback<T = any> = (data: T) => void;

/**
 * Generic async callback function type
 */
export type AsyncCallback<T = any> = (data: T) => Promise<void>;

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (event: T) => void;

/**
 * Notification callback function type
 */
export type NotificationCallback = (notification: any) => void;

/**
 * Generic configuration interface
 */
export interface Config {
  [key: string]: any;
}

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  /** Health status */
  healthy: boolean;
  /** Status message */
  message?: string;
  /** Additional details */
  details?: Record<string, any>;
  /** Check timestamp */
  timestamp: Date;
}

/**
 * Version information interface
 */
export interface VersionInfo {
  /** Major version */
  major: number;
  /** Minor version */
  minor: number;
  /** Patch version */
  patch: number;
  /** Pre-release identifier */
  prerelease?: string;
  /** Build metadata */
  build?: string;
}

/**
 * Pagination interface
 */
export interface Pagination {
  /** Page offset */
  offset: number;
  /** Page limit */
  limit: number;
  /** Total count */
  total?: number;
}

/**
 * Sort configuration interface
 */
export interface SortConfig {
  /** Field to sort by */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Filter configuration interface
 */
export interface FilterConfig {
  /** Field to filter by */
  field: string;
  /** Filter operator */
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';
  /** Filter value */
  value: any;
}