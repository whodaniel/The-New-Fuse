/**
 * Utility functions for the KIMI Orchestrator
 */

import { randomUUID } from 'crypto';

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return randomUUID();
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoff(attempt: number, baseDelayMs: number = 1000): number {
  return Math.min(baseDelayMs * Math.pow(2, attempt), 30000); // Max 30 seconds
}

/**
 * Format a timestamp to ISO string
 */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Calculate percentile from an array of numbers
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Calculate average from an array of numbers
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        (target[key] as Record<string, unknown>) || {},
        source[key] as Record<string, unknown>
      ) as T[Extract<keyof T, string>];
    } else {
      result[key] = source[key] as T[Extract<keyof T, string>];
    }
  }

  return result;
}

/**
 * Validate that an object matches required fields
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  obj: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missing: (keyof T)[] } {
  const missing = requiredFields.filter((field) => {
    const value = obj[field];
    return value === undefined || value === null || value === '';
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Group array items by a key function
 */
export function groupBy<T>(array: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of array) {
    const key = keyFn(item);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }

  return groups;
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

/**
 * Create a throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  intervalMs: number
): (...args: Parameters<T>) => void {
  let lastExecution = 0;

  return (...args: Parameters<T>): void => {
    const now = Date.now();
    if (now - lastExecution >= intervalMs) {
      lastExecution = now;
      fn(...args);
    }
  };
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, onRetry } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = calculateBackoff(attempt, baseDelayMs);
      if (onRetry) {
        onRetry(attempt + 1, error as Error);
      }
      await sleep(delay);
    }
  }

  throw new Error('Retry loop exhausted');
}

/**
 * Timeout wrapper for promises
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs)),
  ]);
}

/**
 * Safely parse JSON with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safely stringify JSON with circular reference handling
 */
export function safeJsonStringify(obj: unknown, space?: string | number): string {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    },
    space
  );
}
