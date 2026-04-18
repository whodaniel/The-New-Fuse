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
export { MCPErrorHandler, ErrorHandlerFactory } from './MCPErrorHandler';
export type { 
  ErrorHandlerConfig, 
  ErrorContext, 
  ErrorHandler, 
  RecoveryResult 
} from './MCPErrorHandler';

// Error monitoring and metrics
export { ErrorMonitor } from './ErrorMonitor';
export type { 
  ErrorMetrics, 
  AlertRule, 
  MonitorConfig 
} from './ErrorMonitor';

// Circuit breaker pattern
export { CircuitBreaker, CircuitBreakerManager } from './CircuitBreaker';
export { CircuitState } from './CircuitBreaker';
export type { 
  CircuitBreakerConfig, 
  CircuitBreakerStats, 
  RequestResult 
} from './CircuitBreaker';

// Graceful degradation
export { GracefulDegradationManager } from './GracefulDegradation';
export { ServiceLevel } from './GracefulDegradation';
export type { 
  DegradationConfig, 
  DegradationLevel, 
  FallbackHandler, 
  ServiceStatus 
} from './GracefulDegradation';

// Failover management
export { FailoverManager } from './FailoverManager';
export type { 
  ServiceEndpoint, 
  FailoverConfig, 
  FailoverStats 
} from './FailoverManager';

// Error types (re-exported from types module)
export { 
  MCPErrorClass, 
  MCPErrorCode, 
  JSONRPCErrorCode,
  ErrorCategory, 
  ErrorSeverity 
} from '../types/error';
export type { 
  ErrorRecoveryStrategy, 
  ErrorStatistics 
} from '../types/error';

// Utilities
export { Logger } from '../utils/Logger';
export type { LogLevel, LogEntry } from '../utils/Logger';