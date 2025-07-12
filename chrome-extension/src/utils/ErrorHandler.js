/**
 * TNF Chrome Extension - Centralized Error Handler
 * Provides comprehensive error handling, logging, and telemetry
 */

import { ERROR_TYPES, MESSAGE_TYPES } from '../config/constants.js';

class ErrorHandler {
  constructor() {
    this.errorHistory = [];
    this.errorCounts = new Map();
    this.suppressedErrors = new Set();
    this.listeners = new Set();
  }

  /**
   * Main error handling method
   * @param {Error|string} error - Error object or message
   * @param {Object} context - Additional context information
   * @param {string} severity - Error severity level
   */
  static handle(error, context = {}, severity = 'error') {
    return ErrorHandler.getInstance().handleError(error, context, severity);
  }

  /**
   * Handle specific error with context
   */
  handleError(error, context = {}, severity = 'error') {
    const errorData = this.createErrorData(error, context, severity);
    
    // Check if error should be suppressed
    if (this.shouldSuppressError(errorData)) {
      return errorData;
    }

    // Log error
    this.logError(errorData);
    
    // Store error history
    this.storeError(errorData);
    
    // Send telemetry
    this.sendTelemetry(errorData);
    
    // Notify listeners
    this.notifyListeners(errorData);
    
    // Take corrective action if needed
    this.handleCriticalErrors(errorData);
    
    return errorData;
  }

  /**
   * Create standardized error data object
   */
  createErrorData(error, context, severity) {
    const timestamp = new Date().toISOString();
    const errorId = this.generateErrorId(error, context);
    
    let message, stack, type;
    
    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
      type = error.name;
    } else {
      message = String(error);
      stack = new Error().stack;
      type = 'GenericError';
    }
    
    return {
      id: errorId,
      message,
      stack,
      type,
      severity,
      timestamp,
      context: {
        ...context,
        url: window.location?.href,
        userAgent: navigator.userAgent,
        extensionId: chrome?.runtime?.id,
        platform: this.detectPlatform()
      },
      count: this.incrementErrorCount(errorId)
    };
  }

  /**
   * Generate unique error ID for deduplication
   */
  generateErrorId(error, context) {
    const message = error instanceof Error ? error.message : String(error);
    const contextKey = context.component || context.function || 'unknown';
    return btoa(`${message}-${contextKey}`).slice(0, 16);
  }

  /**
   * Increment error count for tracking
   */
  incrementErrorCount(errorId) {
    const count = (this.errorCounts.get(errorId) || 0) + 1;
    this.errorCounts.set(errorId, count);
    return count;
  }

  /**
   * Check if error should be suppressed
   */
  shouldSuppressError(errorData) {
    // Suppress repeated errors (more than 10 times)
    if (errorData.count > 10) {
      return true;
    }
    
    // Suppress explicitly suppressed error types
    if (this.suppressedErrors.has(errorData.type)) {
      return true;
    }
    
    // Suppress extension context errors after invalidation
    if (errorData.message.includes('Extension context invalidated') && errorData.count > 3) {
      return true;
    }
    
    return false;
  }

  /**
   * Log error with appropriate level
   */
  logError(errorData) {
    const logMessage = `[TNF Error ${errorData.id}] ${errorData.message}`;
    const logContext = {
      type: errorData.type,
      severity: errorData.severity,
      context: errorData.context,
      count: errorData.count
    };
    
    switch (errorData.severity) {
      case 'critical':
        console.error('🚨', logMessage, logContext);
        break;
      case 'error':
        console.error('❌', logMessage, logContext);
        break;
      case 'warning':
        console.warn('⚠️', logMessage, logContext);
        break;
      case 'info':
        console.info('ℹ️', logMessage, logContext);
        break;
      default:
        console.log('📝', logMessage, logContext);
    }
  }

  /**
   * Store error in history
   */
  storeError(errorData) {
    this.errorHistory.push(errorData);
    
    // Keep only last 100 errors
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-100);
    }
  }

  /**
   * Send error telemetry to background script
   */
  sendTelemetry(errorData) {
    try {
      if (chrome?.runtime?.id) {
        chrome.runtime.sendMessage({
          type: MESSAGE_TYPES.ERROR_REPORT,
          error: errorData
        }).catch(() => {
          // Background script might not be available
          console.warn('Could not send error telemetry');
        });
      }
    } catch (e) {
      // Extension context might be invalid
    }
  }

  /**
   * Notify error listeners
   */
  notifyListeners(errorData) {
    this.listeners.forEach(listener => {
      try {
        listener(errorData);
      } catch (e) {
        console.error('Error listener failed:', e);
      }
    });
  }

  /**
   * Handle critical errors that require immediate action
   */
  handleCriticalErrors(errorData) {
    if (errorData.severity !== 'critical') return;
    
    switch (errorData.type) {
      case ERROR_TYPES.MEMORY_LEAK_DETECTED:
        this.handleMemoryLeak(errorData);
        break;
      case ERROR_TYPES.EXTENSION_CONTEXT_INVALID:
        this.handleContextInvalidation(errorData);
        break;
      case ERROR_TYPES.TNF_CONNECTION_FAILED:
        this.handleConnectionFailure(errorData);
        break;
    }
  }

  /**
   * Handle memory leak situations
   */
  handleMemoryLeak(errorData) {
    console.error('🧠 Memory leak detected, attempting cleanup');
    
    // Trigger garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    // Clear large data structures
    this.clearErrorHistory();
    
    // Notify all components to cleanup
    window.dispatchEvent(new CustomEvent('tnf:memory-cleanup'));
  }

  /**
   * Handle extension context invalidation
   */
  handleContextInvalidation(errorData) {
    console.warn('🔌 Extension context invalidated, stopping operations');
    
    // Stop all timers and intervals
    window.dispatchEvent(new CustomEvent('tnf:context-invalidated'));
    
    // Suppress further context errors
    this.suppressedErrors.add(ERROR_TYPES.EXTENSION_CONTEXT_INVALID);
  }

  /**
   * Handle TNF connection failures
   */
  handleConnectionFailure(errorData) {
    console.warn('🔗 TNF connection failed, switching to offline mode');
    
    // Notify components to switch to offline mode
    window.dispatchEvent(new CustomEvent('tnf:connection-lost'));
  }

  /**
   * Detect current AI platform
   */
  detectPlatform() {
    const hostname = window.location?.hostname || '';
    if (hostname.includes('gemini.google.com')) return 'gemini';
    if (hostname.includes('chatgpt.com')) return 'chatgpt';
    if (hostname.includes('claude.ai')) return 'claude';
    return 'unknown';
  }

  /**
   * Add error listener
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove error listener
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorHistory = [];
    this.errorCounts.clear();
  }

  /**
   * Get error statistics
   */
  getStatistics() {
    const total = this.errorHistory.length;
    const byType = {};
    const bySeverity = {};
    
    this.errorHistory.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });
    
    return {
      total,
      byType,
      bySeverity,
      recentErrors: this.errorHistory.slice(-10)
    };
  }

  /**
   * Suppress specific error types
   */
  suppressErrorType(errorType) {
    this.suppressedErrors.add(errorType);
  }

  /**
   * Unsuppress specific error types
   */
  unsuppressErrorType(errorType) {
    this.suppressedErrors.delete(errorType);
  }

  /**
   * Singleton pattern
   */
  static getInstance() {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
}

// Convenience methods for different error types
export const handleError = (error, context) => ErrorHandler.handle(error, context, 'error');
export const handleWarning = (error, context) => ErrorHandler.handle(error, context, 'warning');
export const handleCritical = (error, context) => ErrorHandler.handle(error, context, 'critical');
export const handleInfo = (error, context) => ErrorHandler.handle(error, context, 'info');

// Error boundary for async functions
export const withErrorBoundary = (asyncFn, context = {}) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      handleError(error, { ...context, function: asyncFn.name });
      throw error;
    }
  };
};

// Error boundary for regular functions
export const withSyncErrorBoundary = (fn, context = {}) => {
  return (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      handleError(error, { ...context, function: fn.name });
      throw error;
    }
  };
};

export default ErrorHandler;
