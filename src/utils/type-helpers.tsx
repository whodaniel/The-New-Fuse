// filepath: src/utils/type-helpers.ts

/**
 * Helper functions for TypeScript type issues
 */

/**
 * Safely cast unknown to Record<string, unknown>
 */
export function safeObjectCast(input: unknown): Record<string, unknown> {
  if(typeof input === "object" && input !== null) {
    return input as Record<string, unknown>;
  }
  return {};
}

/**
 * Handle error objects safely
 */
export function formatError(error: unknown): Record<string, unknown> {
  const errorObj: Record<string, unknown> = {};

  if(error instanceof Error) {
    errorObj.message = error.message;
    errorObj.name = error.name;
    errorObj.stack = error.stack;
  } else if(typeof error === "string") {
    errorObj.message = error;
  } else if(typeof error === "object" && error !== null) {
    Object.assign(errorObj, error);
  } else {
    errorObj.message = "Unknown error";
  }

  return errorObj;
}

/**
 * Safely convert string or null to string
 */
export function safeString(input: string | null | undefined): string {
  return input ?? "";
}

/**
 * Safely handle unknown errors
 */
export function handleUnknownError(error: unknown): string {
  if(error instanceof Error) {
    return error.message;
  } else if(typeof error === "string") {
    return error;
  } else if(typeof error === "object" && error !== null) {
    return JSON.stringify(error);
  } else {
    return "Unknown error";
  }
}

/**
 * Type guard to check if an object has a property
 */
export function hasProperty<T extends object, K extends string>(
  obj: T, 
  prop: K
): obj is T & Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
