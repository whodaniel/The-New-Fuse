/**
 * MCP Error Handling System
 *
 * This module provides comprehensive error handling, monitoring, and recovery
 * capabilities for the MCP system, including circuit breakers, graceful degradation,
 * and automatic failover mechanisms.
 */
export { MCPUnifiedErrorHandler } from './MCPUnifiedErrorHandler.js';
export type { MCPError, MCPErrorContext, MCPErrorHandlerConfig } from './MCPUnifiedErrorHandler.js';
export { MCPErrorHandler, ErrorHandlerFactory } from './MCPErrorHandler.js';
export type { ErrorHandlerConfig, ErrorContext, ErrorHandler, RecoveryResult } from './MCPErrorHandler.js';
export { ErrorMonitor } from './ErrorMonitor.js';
export type { ErrorMetrics, AlertRule, MonitorConfig } from './ErrorMonitor.js';
export { CircuitBreaker, CircuitBreakerManager } from './CircuitBreaker.js';
export { CircuitState } from './CircuitBreaker.js';
export type { CircuitBreakerConfig, CircuitBreakerStats, RequestResult } from './CircuitBreaker.js';
export { GracefulDegradationManager } from './GracefulDegradation.js';
export { ServiceLevel } from './GracefulDegradation.js';
export type { DegradationConfig, DegradationLevel, FallbackHandler, ServiceStatus } from './GracefulDegradation.js';
export { FailoverManager } from './FailoverManager.js';
export type { ServiceEndpoint, FailoverConfig, FailoverStats } from './FailoverManager.js';
export { MCPErrorClass, MCPErrorCode, JSONRPCErrorCode, ErrorCategory, ErrorSeverity } from '../types/error.js';
export type { ErrorRecoveryStrategy, ErrorStatistics } from '../types/error.js';
export { Logger } from '../utils/Logger.js';
export type { LogLevel, LogEntry } from '../utils/Logger.js';
//# sourceMappingURL=index.d.ts.map