/**
 * Type-safe parsers for handling unknown data
 */
/**
 * Parse unknown to string
 */
export declare function parseString(value: unknown, fallback?: string): string;
/**
 * Parse unknown to number
 */
export declare function parseNumber(value: unknown, fallback?: number): number;
/**
 * Parse unknown to boolean
 */
export declare function parseBoolean(
  value: unknown,
  fallback?: boolean,
): boolean;
/**
 * Parse unknown to Date
 */
export declare function parseDate(value: unknown, fallback?: Date): Date;
/**
 * Parse unknown to array
 */
export declare function parseArray<T>(
  value: unknown,
  itemParser: (item: unknown) => T,
  fallback?: T[],
): T[];
/**
 * Parse unknown to object
 */
export declare function parseObject<T extends Record<string, any>>(
  value: unknown,
  fallback?: T,
): T;
