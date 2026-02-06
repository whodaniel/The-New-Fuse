/**
 * Error handling utilities
 */

export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message));
  }

  return new Error('Unknown error occurred');
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}
