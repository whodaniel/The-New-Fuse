/**
 * Error utilities for consistent error handling throughout the extension
 */

/**
 * Extract a human-readable error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  } else {
    return String(error);
  }
}

/**
 * Format an error for display in the UI (shortened version)
 */
export function formatErrorForDisplay(error: unknown): string {
  const message = getErrorMessage(error);
  // Truncate very long messages for display
  const maxLength = 150;
  if (message.length > maxLength) {
    return `${message.substring(0, maxLength)}...`;
  }
  return message;
}

/**
 * Create a standardized error with additional context
 */
export function createContextualError(message: string, originalError?: unknown, context?: Record<string, any>): Error {
  let fullMessage = message;
  
  // Add original error if provided
  if (originalError) {
    fullMessage += `: ${getErrorMessage(originalError)}`;
  }
  
  // Create new error with the combined message
  const error = new Error(fullMessage);
  
  // Preserve original stack trace if possible
  if (originalError instanceof Error && originalError.stack) {
    error.stack = originalError.stack;
  }
  
  // Add context as properties
  if (context) {
    Object.entries(context).forEach(([key, value]) => {
      (error as any)[key] = value;
    });
  }
  
  return error;
}

/**
 * Wrap a function with try-catch and return a default value on error
 */
export function tryCatch<T, R>(
  fn: (...args: T[]) => R,
  defaultValue: R,
  errorHandler?: (error: unknown) => void
): (...args: T[]) => R {
  return (...args: T[]): R => {
    try {
      return fn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error);
      }
      return defaultValue;
    }
  };
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Check if an error is a specific type
 */
export function isErrorOfType<T extends Error>(
  error: unknown,
  errorType: new (...args: any[]) => T
): error is T {
  return error instanceof errorType;
}

/**
 * Typed error for MCP protocol errors
 */
export class McpProtocolError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'McpProtocolError';
  }
}

/**
 * Typed error for communication errors
 */
export class CommunicationError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'CommunicationError';
  }
}

/**
 * Typed error for authentication errors
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}