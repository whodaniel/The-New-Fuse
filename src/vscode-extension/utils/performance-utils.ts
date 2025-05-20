/**
 * Utility functions for performance optimization
 */

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation.
 * 
 * @param {Function} func The function to debounce
 * @param {number} wait The number of milliseconds to delay
 * @param {boolean} immediate Whether to invoke the function immediately
 * @returns {Function} The debounced function
 */
export function debounce(func: Function, wait: number = 300, immediate: boolean = false): Function {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: any[]) {
    const context = this;
    
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(context, args);
  };
}

/**
 * Creates a throttled function that only invokes the provided function
 * at most once per every wait milliseconds.
 * 
 * @param {Function} func The function to throttle
 * @param {number} wait The number of milliseconds to wait between invocations
 * @returns {Function} The throttled function
 */
export function throttle(func: Function, wait: number = 300): Function {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  
  return function(this: any, ...args: any[]) {
    const context = this;
    const now = Date.now();
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(context, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(context, args);
      }, remaining);
    }
  };
}

/**
 * Measures the execution time of a function
 * 
 * @param {Function} func The function to measure
 * @param {string} label An optional label for logging
 * @returns {Function} A wrapped function that logs execution time
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  func: T, 
  label: string = func.name || 'Anonymous function'
): (...args: Parameters<T>) => ReturnType<T> {
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const start = performance.now();
    const result = func.apply(this, args);
    
    // If the result is a promise, measure when it resolves
    if (result instanceof Promise) {
      return result.then((value) => {
        const end = performance.now();
        console.log(`${label} took ${end - start}ms`);
        return value;
      }) as ReturnType<T>;
    }
    
    const end = performance.now();
    console.log(`${label} took ${end - start}ms`);
    return result;
  };
}