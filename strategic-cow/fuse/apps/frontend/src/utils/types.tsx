// Type utility functions

/**
 * Safely cast a value to a specific type, returning undefined if the cast fails
 * @param value The value to cast
 * @param type The expected type of the value
 * @returns The cast value or undefined if the cast fails
 */
export function castToType<T>(value: unknown, type: string): T | undefined {
  if (typeof value === type) {
    return value as T;
  }
  return undefined;
}

/**
 * Check if a value is of a specific type
 * @param value The value to check
 * @param type The expected type of the value
 * @returns True if the value is of the specified type
 */
export function isType(value: unknown, type: string): boolean {
  return typeof value === type;
}

/**
 * Ensure a value is of a specific type, throwing an error if it isn't
 * @param value The value to check
 * @param type The expected type of the value
 * @returns The value if it's of the correct type
 * @throws Error if the value is not of the correct type
 */
export function ensureType<T>(value: unknown, type: string): T {
  if (typeof value !== type) {
    throw new Error(`Expected ${type} but got ${typeof value}`);
  }
  return value as T;
}