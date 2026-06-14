/**
 * MCP Error Handling System
 *
 * This module provides comprehensive error handling, monitoring, and recovery
 * capabilities for the MCP system, including circuit breakers, graceful degradation,
 * and automatic failover mechanisms.
 */
// New unified error handler (recommended)
export { MCPUnifiedErrorHandler } from './MCPUnifiedErrorHandler.js';
// Legacy core error handling (deprecated - use MCPUnifiedErrorHandler instead)
export { MCPErrorHandler, ErrorHandlerFactory } from './MCPErrorHandler.js';
// Error monitoring and metrics
export { ErrorMonitor } from './ErrorMonitor.js';
// Circuit breaker pattern
export { CircuitBreaker, CircuitBreakerManager } from './CircuitBreaker.js';
export { CircuitState } from './CircuitBreaker.js';
// Graceful degradation
export { GracefulDegradationManager } from './GracefulDegradation.js';
export { ServiceLevel } from './GracefulDegradation.js';
// Failover management
export { FailoverManager } from './FailoverManager.js';
// Error types (re-exported from types module)
export { MCPErrorClass, MCPErrorCode, JSONRPCErrorCode, ErrorCategory, ErrorSeverity } from '../types/error.js';
// Utilities
export { Logger } from '../utils/Logger.js';
//# sourceMappingURL=index.js.map