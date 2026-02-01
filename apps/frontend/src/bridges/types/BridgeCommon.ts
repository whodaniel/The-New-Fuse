/**
 * ============================================================
 * FILE: src/bridges/types/BridgeCommon.ts
 * ============================================================
 *
 * Core type definitions for the Bridge Layer.
 * These types provide a standardized interface for all bridge hooks
 * to communicate state, connections, and subscriptions to UI components.
 *
 * @module bridges/types
 */

// ─────────────────────────────────────────────────────────────
// BRIDGE STATE
// ─────────────────────────────────────────────────────────────

/**
 * Generic state container for async data in bridge hooks.
 * Provides a consistent pattern for loading, error, and data states.
 *
 * @template T - The type of data being managed
 *
 * @example
 * ```typescript
 * const agents: BridgeState<Agent[]> = {
 *   data: [],
 *   loading: false,
 *   error: null,
 *   lastUpdated: new Date(),
 * };
 * ```
 */
export interface BridgeState<T> {
  /** The current data, null if not yet loaded or on error */
  data: T | null;
  /** Whether the data is currently being fetched/updated */
  loading: boolean;
  /** Error object if the last operation failed, null otherwise */
  error: Error | null;
  /** Timestamp of the last successful data update */
  lastUpdated: Date | null;
}

/**
 * Creates a default empty BridgeState for initialization
 */
export function createInitialBridgeState<T>(): BridgeState<T> {
  return {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  };
}

/**
 * Creates a loading BridgeState
 */
export function createLoadingBridgeState<T>(currentData: T | null = null): BridgeState<T> {
  return {
    data: currentData,
    loading: true,
    error: null,
    lastUpdated: null,
  };
}

/**
 * Creates a success BridgeState with data
 */
export function createSuccessBridgeState<T>(data: T): BridgeState<T> {
  return {
    data,
    loading: false,
    error: null,
    lastUpdated: new Date(),
  };
}

/**
 * Creates an error BridgeState
 */
export function createErrorBridgeState<T>(
  error: Error,
  currentData: T | null = null
): BridgeState<T> {
  return {
    data: currentData,
    loading: false,
    error,
    lastUpdated: null,
  };
}

// ─────────────────────────────────────────────────────────────
// CONNECTION STATE
// ─────────────────────────────────────────────────────────────

/**
 * Possible connection statuses for real-time bridges
 */
export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

/**
 * Represents the state of a real-time connection (WebSocket, Redis, etc.)
 *
 * @example
 * ```typescript
 * const connection: ConnectionState = {
 *   status: 'connected',
 *   latency: 15,
 *   lastHeartbeat: new Date(),
 *   reconnectAttempt: 0,
 *   error: null,
 * };
 * ```
 */
export interface ConnectionState {
  /** Current connection status */
  status: ConnectionStatus;
  /** Round-trip latency in milliseconds, null if not measured */
  latency: number | null;
  /** Timestamp of the last successful heartbeat/ping */
  lastHeartbeat: Date | null;
  /** Current reconnection attempt number (0 if connected) */
  reconnectAttempt: number;
  /** Error details if status is 'error' */
  error: Error | null;
}

/**
 * Creates a default disconnected ConnectionState
 */
export function createInitialConnectionState(): ConnectionState {
  return {
    status: 'disconnected',
    latency: null,
    lastHeartbeat: null,
    reconnectAttempt: 0,
    error: null,
  };
}

/**
 * Creates a connecting ConnectionState
 */
export function createConnectingState(reconnectAttempt: number = 0): ConnectionState {
  return {
    status: reconnectAttempt > 0 ? 'reconnecting' : 'connecting',
    latency: null,
    lastHeartbeat: null,
    reconnectAttempt,
    error: null,
  };
}

/**
 * Creates a connected ConnectionState
 */
export function createConnectedState(latency: number | null = null): ConnectionState {
  return {
    status: 'connected',
    latency,
    lastHeartbeat: new Date(),
    reconnectAttempt: 0,
    error: null,
  };
}

/**
 * Creates an error ConnectionState
 */
export function createConnectionErrorState(
  error: Error,
  reconnectAttempt: number = 0
): ConnectionState {
  return {
    status: 'error',
    latency: null,
    lastHeartbeat: null,
    reconnectAttempt,
    error,
  };
}

// ─────────────────────────────────────────────────────────────
// SUBSCRIPTION HANDLE
// ─────────────────────────────────────────────────────────────

/**
 * Handle returned by subscription methods.
 * Used to manage and clean up subscriptions.
 *
 * @example
 * ```typescript
 * const subscription = useRelayCore().subscribeToMessages(
 *   { messageType: ['TASK_REQUEST'] },
 *   (message) => console.log(message)
 * );
 *
 * // Later, to unsubscribe:
 * subscription.unsubscribe();
 * ```
 */
export interface SubscriptionHandle {
  /** Unique identifier for this subscription */
  id: string;
  /** Function to call to unsubscribe and clean up */
  unsubscribe: () => void;
  /** Whether the subscription is currently active */
  isActive: boolean;
  /** Timestamp when the subscription was created */
  createdAt: Date;
}

/**
 * Creates a subscription handle with the given unsubscribe function
 */
export function createSubscriptionHandle(
  id: string,
  unsubscribeFn: () => void
): SubscriptionHandle {
  let isActive = true;

  return {
    id,
    get isActive() {
      return isActive;
    },
    unsubscribe: () => {
      if (isActive) {
        isActive = false;
        unsubscribeFn();
      }
    },
    createdAt: new Date(),
  };
}

// ─────────────────────────────────────────────────────────────
// BRIDGE CONFIGURATION
// ─────────────────────────────────────────────────────────────

/**
 * Common configuration options for bridge hooks
 */
export interface BridgeConfig {
  /** Base URL for HTTP requests */
  baseUrl: string;
  /** WebSocket URL for real-time connections */
  wsUrl: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Number of retry attempts for failed operations */
  retryAttempts: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay: number;
  /** Whether to automatically reconnect on disconnect */
  autoReconnect: boolean;
  /** Maximum reconnection attempts (0 = unlimited) */
  maxReconnectAttempts: number;
  /** Enable debug logging */
  debug: boolean;
}

/**
 * Default bridge configuration
 */
export const DEFAULT_BRIDGE_CONFIG: BridgeConfig = {
  baseUrl: process.env.VITE_API_URL || 'http://localhost:3001',
  wsUrl: process.env.VITE_WS_URL || 'ws://localhost:3001/ws',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  autoReconnect: true,
  maxReconnectAttempts: 5,
  debug: process.env.NODE_ENV === 'development',
};

// ─────────────────────────────────────────────────────────────
// UTILITY TYPES
// ─────────────────────────────────────────────────────────────

/**
 * Options for history/pagination queries
 */
export interface HistoryOptions {
  /** Maximum number of items to return */
  limit?: number;
  /** Number of items to skip */
  offset?: number;
  /** Return items since this date */
  since?: Date;
  /** Return items until this date */
  until?: Date;
}

/**
 * Generic pagination response
 */
export interface PaginatedResponse<T> {
  /** The items for the current page */
  items: T[];
  /** Total number of items across all pages */
  total: number;
  /** Current page number (0-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Whether there are more pages */
  hasMore: boolean;
}

/**
 * Priority levels for messages and tasks
 */
export type Priority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Generic operation result
 */
export interface OperationResult<T = void> {
  /** Whether the operation succeeded */
  success: boolean;
  /** The result data if successful */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Additional error details */
  errorDetails?: Record<string, unknown>;
}

/**
 * Event callback type for subscription events
 */
export type EventCallback<T> = (event: T) => void;

/**
 * Cleanup function type
 */
export type CleanupFn = () => void;

// ─────────────────────────────────────────────────────────────
// LOGGING UTILITIES
// ─────────────────────────────────────────────────────────────

/**
 * Log levels for bridge debugging
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Bridge logger interface
 */
export interface BridgeLogger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

/**
 * Creates a bridge logger with the given prefix
 */
export function createBridgeLogger(prefix: string, enabled: boolean = true): BridgeLogger {
  const formatMessage = (level: LogLevel, message: string): string => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${prefix}] [${level.toUpperCase()}] ${message}`;
  };

  const noop = (): void => {};

  if (!enabled) {
    return {
      debug: noop,
      info: noop,
      warn: noop,
      error: noop,
    };
  }

  return {
    debug: (message: string, ...args: unknown[]) => {
      console.debug(formatMessage('debug', message), ...args);
    },
    info: (message: string, ...args: unknown[]) => {
      console.info(formatMessage('info', message), ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
      console.warn(formatMessage('warn', message), ...args);
    },
    error: (message: string, ...args: unknown[]) => {
      console.error(formatMessage('error', message), ...args);
    },
  };
}

// ─────────────────────────────────────────────────────────────
// TYPE GUARDS
// ─────────────────────────────────────────────────────────────

/**
 * Type guard to check if a BridgeState has data
 */
export function hasData<T>(state: BridgeState<T>): state is BridgeState<T> & { data: T } {
  return state.data !== null;
}

/**
 * Type guard to check if a BridgeState has an error
 */
export function hasError<T>(state: BridgeState<T>): state is BridgeState<T> & { error: Error } {
  return state.error !== null;
}

/**
 * Type guard to check if connection is established
 */
export function isConnected(state: ConnectionState): boolean {
  return state.status === 'connected';
}

/**
 * Type guard to check if connection is attempting to connect
 */
export function isConnecting(state: ConnectionState): boolean {
  return state.status === 'connecting' || state.status === 'reconnecting';
}
