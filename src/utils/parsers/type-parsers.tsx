// src/utils/parsers/type-parsers.ts
/**
 * Type-safe parsers for handling unknown data
 */

/**
 * Parse unknown to string
 */
export function parseString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
}

export function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && !isNaN(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

export function parseBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return fallback;
}

export function parseDate(value: unknown, fallback = new Date()): Date {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? fallback : date;
  }
  return fallback;
}

export function parseArray<T>(
  value: unknown,
  itemParser: (item: unknown) => T,
  fallback: T[] = []
): T[] {
  if (Array.isArray(value)) {
    return value.map(itemParser);
  }
  return fallback;
}

/**
 * Parse unknown to object
 */
export function parseObject<T>(
  value: unknown,
  fallback: T = {} as T
): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }
  return fallback;
}
