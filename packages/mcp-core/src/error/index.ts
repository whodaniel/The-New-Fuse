/**
 * MCP Error Handling System
 * 
 * This module provides comprehensive error handling, monitoring, and recovery
 * capabilities for the MCP system, including circuit breakers, graceful degradation,
 * and automatic failover mechanisms.
 */

// New unified error handler (recommended)
export { MCPUnifiedErrorHandler } from './MCPUnifiedErrorHandler.js';
export type { MCPError, MCPErrorContext, MCPErrorHandlerConfig } from './MCPUnifiedErrorHandler.js';

// Legacy core error handling (deprecated - use MCPUnifiedErrorHandler instead)
export { MCPErrorHandler, ErrorHandlerFactory } from './MCPErrorHandler.js';
export type { 
  ErrorHandlerConfig, 
  ErrorContext, 
  ErrorHandler, 
  RecoveryResult 
} from './MCPErrorHandler.js';

// Error monitoring and metrics
export { ErrorMonitor } from './ErrorMonitor.js';
export type { 
  ErrorMetrics, 
  AlertRule, 
  MonitorConfig 
} from './ErrorMonitor.js';

// Circuit breaker pattern
export { CircuitBreaker, CircuitBreakerManager } from './CircuitBreaker.js';
export { CircuitState } from './CircuitBreaker.js';
export type { 
  CircuitBreakerConfig, 
  CircuitBreakerStats, 
  RequestResult 
} from './CircuitBreaker.js';

// Graceful degradation
export { GracefulDegradationManager } from './GracefulDegradation.js';
export { ServiceLevel } from './GracefulDegradation.js';
export type { 
  DegradationConfig, 
  DegradationLevel, 
  FallbackHandler, 
  ServiceStatus 
} from './GracefulDegradation.js';

// Failover management
export { FailoverManager } from './FailoverManager.js';
export type { 
  ServiceEndpoint, 
  FailoverConfig, 
  FailoverStats 
} from './FailoverManager.js';

// Error types (re-exported from types module)
export { 
  MCPErrorClass, 
  MCPErrorCode, 
  JSONRPCErrorCode,
  ErrorCategory, 
  ErrorSeverity 
} from '../types/error.js';
export type { 
  ErrorRecoveryStrategy, 
  ErrorStatistics 
} from '../types/error.js';

// Utilities
export { Logger } from '../utils/Logger.js';
export type { LogLevel, LogEntry } from '../utils/Logger.js';