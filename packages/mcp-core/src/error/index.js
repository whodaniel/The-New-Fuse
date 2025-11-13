"use strict";
/**
 * MCP Error Handling System
 *
 * This module provides comprehensive error handling, monitoring, and recovery
 * capabilities for the MCP system, including circuit breakers, graceful degradation,
 * and automatic failover mechanisms.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.ErrorSeverity = exports.ErrorCategory = exports.JSONRPCErrorCode = exports.MCPErrorCode = exports.MCPErrorClass = exports.FailoverManager = exports.ServiceLevel = exports.GracefulDegradationManager = exports.CircuitState = exports.CircuitBreakerManager = exports.CircuitBreaker = exports.ErrorMonitor = exports.ErrorHandlerFactory = exports.MCPErrorHandler = exports.MCPUnifiedErrorHandler = void 0;
// New unified error handler (recommended)
var MCPUnifiedErrorHandler_1 = require("./MCPUnifiedErrorHandler");
Object.defineProperty(exports, "MCPUnifiedErrorHandler", { enumerable: true, get: function () { return MCPUnifiedErrorHandler_1.MCPUnifiedErrorHandler; } });
// Legacy core error handling (deprecated - use MCPUnifiedErrorHandler instead)
var MCPErrorHandler_1 = require("./MCPErrorHandler");
Object.defineProperty(exports, "MCPErrorHandler", { enumerable: true, get: function () { return MCPErrorHandler_1.MCPErrorHandler; } });
Object.defineProperty(exports, "ErrorHandlerFactory", { enumerable: true, get: function () { return MCPErrorHandler_1.ErrorHandlerFactory; } });
// Error monitoring and metrics
var ErrorMonitor_1 = require("./ErrorMonitor");
Object.defineProperty(exports, "ErrorMonitor", { enumerable: true, get: function () { return ErrorMonitor_1.ErrorMonitor; } });
// Circuit breaker pattern
var CircuitBreaker_1 = require("./CircuitBreaker");
Object.defineProperty(exports, "CircuitBreaker", { enumerable: true, get: function () { return CircuitBreaker_1.CircuitBreaker; } });
Object.defineProperty(exports, "CircuitBreakerManager", { enumerable: true, get: function () { return CircuitBreaker_1.CircuitBreakerManager; } });
var CircuitBreaker_2 = require("./CircuitBreaker");
Object.defineProperty(exports, "CircuitState", { enumerable: true, get: function () { return CircuitBreaker_2.CircuitState; } });
// Graceful degradation
var GracefulDegradation_1 = require("./GracefulDegradation");
Object.defineProperty(exports, "GracefulDegradationManager", { enumerable: true, get: function () { return GracefulDegradation_1.GracefulDegradationManager; } });
var GracefulDegradation_2 = require("./GracefulDegradation");
Object.defineProperty(exports, "ServiceLevel", { enumerable: true, get: function () { return GracefulDegradation_2.ServiceLevel; } });
// Failover management
var FailoverManager_1 = require("./FailoverManager");
Object.defineProperty(exports, "FailoverManager", { enumerable: true, get: function () { return FailoverManager_1.FailoverManager; } });
// Error types (re-exported from types module)
var error_1 = require("../types/error");
Object.defineProperty(exports, "MCPErrorClass", { enumerable: true, get: function () { return error_1.MCPErrorClass; } });
Object.defineProperty(exports, "MCPErrorCode", { enumerable: true, get: function () { return error_1.MCPErrorCode; } });
Object.defineProperty(exports, "JSONRPCErrorCode", { enumerable: true, get: function () { return error_1.JSONRPCErrorCode; } });
Object.defineProperty(exports, "ErrorCategory", { enumerable: true, get: function () { return error_1.ErrorCategory; } });
Object.defineProperty(exports, "ErrorSeverity", { enumerable: true, get: function () { return error_1.ErrorSeverity; } });
// Utilities
var Logger_1 = require("../utils/Logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return Logger_1.Logger; } });
//# sourceMappingURL=index.js.map