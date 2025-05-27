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
export declare function debounce(func: Function, wait?: number, immediate?: boolean): Function;
/**
 * Creates a throttled function that only invokes the provided function
 * at most once per every wait milliseconds.
 *
 * @param {Function} func The function to throttle
 * @param {number} wait The number of milliseconds to wait between invocations
 * @returns {Function} The throttled function
 */
export declare function throttle(func: Function, wait?: number): Function;
/**
 * Measures the execution time of a function
 *
 * @param {Function} func The function to measure
 * @param {string} label An optional label for logging
 * @returns {Function} A wrapped function that logs execution time
 */
export declare function measurePerformance<T extends (...args: any[]) => any>(func: T, label?: string): (...args: Parameters<T>) => ReturnType<T>;
//# sourceMappingURL=performance-utils.d.ts.map