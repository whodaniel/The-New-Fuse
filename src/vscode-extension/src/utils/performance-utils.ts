/**
 * Performance utilities inspired by Copilot's internal implementation patterns
 */

/**
 * Creates a debounced function that delays invoking `func` until after `wait` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns The debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a throttled function that only invokes `func` at most once per
 * every `wait` milliseconds.
 * @param func The function to throttle
 * @param wait The number of milliseconds to throttle invocations to
 * @returns The throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  
  return function(...args: Parameters<T>): void {
    const now = Date.now();
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func(...args);
    } else if (timeout === null) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  };
}

/**
 * Measures the execution time of a function
 * @param func The function to measure
 * @param label Optional label for logging
 * @returns A new function that measures the execution time of the original function
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  func: T,
  label?: string
): (...args: Parameters<T>) => ReturnType<T> {
  return function(...args: Parameters<T>): ReturnType<T> {
    const start = performance.now();
    const result = func(...args);
    const end = performance.now();
    
    const functionName = label || func.name || 'Anonymous function';
    console.log(`[Performance] ${functionName} executed in ${(end - start).toFixed(2)}ms`);
    
    return result;
  };
}

/**
 * Decorates a Promise-returning function to add a timeout
 * @param func The async function to add a timeout to
 * @param timeoutMs The timeout in milliseconds
 * @param timeoutValue The value to return on timeout (optional)
 * @returns A function that will reject after the timeout
 */
export function withTimeout<T extends (...args: any[]) => Promise<any>>(
  func: T,
  timeoutMs: number,
  timeoutValue?: any
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async function(...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (timeoutValue !== undefined) {
          resolve(timeoutValue as ReturnType<T>);
        } else {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);
      
      func(...args)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  };
}

/**
 * Reusable memoize function to cache expensive operations
 * @param func The function to memoize
 * @param resolver Optional function to resolve the cache key
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  
  return function(...args: Parameters<T>): ReturnType<T> {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}