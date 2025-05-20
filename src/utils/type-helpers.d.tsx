/**
 * Helper functions for TypeScript type issues
 */
/**
 * Safely cast unknown to Record<string, unknown>
 */
export declare function safeObjectCast(input: unknown): Record<string, unknown>;
/**
 * Handle error objects safely
 */
export declare function formatError(error: unknown): Record<string, unknown>;
/**
 * Safely convert string or null to string
 */
export declare function safeString(input: string | null | undefined): string;
/**
 * Safely handle unknown errors
 */
export declare function handleUnknownError(error: unknown): string;
/**
 * Type guard for checking if an object has a specific property
 */
export declare function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  prop: K,
): obj is T & Record<K, unknown>;
