/**
 * MCP Error Handling System
 *
 * This module provides comprehensive error handling, monitoring, and recovery
 * capabilities for the MCP system, including circuit breakers, graceful degradation,
 * and automatic failover mechanisms.
 */

// New unified error handler (recommended)
export { MCPUnifiedErrorHandler } from './MCPUnifiedErrorHandler';
export type { MCPError, MCPErrorContext, MCPErrorHandlerConfig } from './MCPUnifiedErrorHandler';

// Legacy core error handling (deprecated - use MCPUnifiedErrorHandler instead)
export { ErrorHandlerFactory, MCPErrorHandler } from './MCPErrorHandler';
export type {
  ErrorContext,
  ErrorHandler,
  ErrorHandlerConfig,
  RecoveryResult,
} from './MCPErrorHandler';

// Error monitoring and metrics
export { ErrorMonitor } from './ErrorMonitor';
export type { AlertRule, ErrorMetrics, MonitorConfig } from './ErrorMonitor';

// Circuit breaker pattern
export { CircuitBreaker, CircuitBreakerManager, CircuitState } from './CircuitBreaker';
export type { CircuitBreakerConfig, CircuitBreakerStats, RequestResult } from './CircuitBreaker';

// Graceful degradation
export { GracefulDegradationManager, ServiceLevel } from './GracefulDegradation';
export type {
  DegradationConfig,
  DegradationLevel,
  FallbackHandler,
  ServiceStatus,
} from './GracefulDegradation';

// Failover management
export { FailoverManager } from './FailoverManager';
export type { FailoverConfig, FailoverStats, ServiceEndpoint } from './FailoverManager';

// Error types (re-exported from types module)
export {
  ErrorCategory,
  ErrorSeverity,
  JSONRPCErrorCode,
  MCPErrorClass,
  MCPErrorCode,
} from '../types/error';
export type { ErrorRecoveryStrategy, ErrorStatistics } from '../types/error';

// Utilities
export { Logger } from '../utils/Logger';
export type { LogEntry, LogLevel } from '../utils/Logger';
