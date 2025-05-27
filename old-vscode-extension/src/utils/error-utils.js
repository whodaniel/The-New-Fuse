/**
 * Utility functions for error handling
 */

/**
 * Get a standardized error message from an error object
 * @param {Error|string|unknown} error - The error to extract a message from
 * @returns {string} A standardized error message
 */
export function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  } else {
    return String(error);
  }
}

/**
 * Create a standardized error object with additional context
 * @param {string} message - The error message
 * @param {Error|null} originalError - The original error, if any
 * @param {Record<string, any>} context - Additional context for the error
 * @returns {Error} A standardized error object
 */
export function createError(message, originalError = null, context = {}) {
  const error = new Error(message);
  
  // Add original error details if available
  if (originalError) {
    error.cause = originalError;
    error.stack = `${error.stack}\nCaused by: ${originalError.stack || originalError}`;
  }
  
  // Add context
  error.context = context;
  
  return error;
}
