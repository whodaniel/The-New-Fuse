"use strict";
/**
 * Utility functions for performance optimization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = debounce;
exports.throttle = throttle;
exports.measurePerformance = measurePerformance;
/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation.
 *
 * @param {Function} func The function to debounce
 * @param {number} wait The number of milliseconds to delay
 * @param {boolean} immediate Whether to invoke the function immediately
 * @returns {Function} The debounced function
 */
function debounce(func, wait = 300, immediate = false) {
    let timeout = null;
    return function (...args) {
        const context = this;
        const later = () => {
            timeout = null;
            if (!immediate)
                func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow)
            func.apply(context, args);
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
function throttle(func, wait = 300) {
    let timeout = null;
    let previous = 0;
    return function (...args) {
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
        }
        else if (!timeout) {
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
function measurePerformance(func, label = func.name || 'Anonymous function') {
    return function (...args) {
        const start = performance.now();
        const result = func.apply(this, args);
        // If the result is a promise, measure when it resolves
        if (result instanceof Promise) {
            return result.then((value) => {
                const end = performance.now();
                console.log(`${label} took ${end - start}ms`);
                return value;
            });
        }
        const end = performance.now();
        console.log(`${label} took ${end - start}ms`);
        return result;
    };
}
//# sourceMappingURL=performance-utils.js.map