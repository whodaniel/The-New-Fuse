"use strict";
/**
 * Common Utility Functions
 * Consolidates all utility logic across the monorepo
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.utils = exports.asyncUtils = exports.formatUtils = exports.stringUtils = exports.objectUtils = void 0;
/**
 * Object utilities for common object operations
 */
exports.objectUtils = {
    /**
     * Deep clone an object using JSON serialization
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    /**
     * Deep merge two objects
     */
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            }
            else {
                result[key] = source[key];
            }
        }
        return result;
    },
    /**
     * Check if object is empty
     */
    isEmpty(obj) {
        if (obj == null)
            return true;
        if (Array.isArray(obj))
            return obj.length === 0;
        if (typeof obj === 'object')
            return Object.keys(obj).length === 0;
        return false;
    },
    /**
     * Check if value is defined (not null or undefined)
     */
    isDefined(value) {
        return value !== null && value !== undefined;
    },
    /**
     * Pick specific keys from an object
     */
    pick(obj, keys) {
        const result = {};
        keys.forEach(key => {
            if (key in obj) {
                result[key] = obj[key];
            }
        });
        return result;
    },
    /**
     * Omit specific keys from an object
     */
    omit(obj, keys) {
        const result = { ...obj };
        keys.forEach(key => {
            delete result[key];
        });
        return result;
    },
};
/**
 * String utilities for common string operations
 */
exports.stringUtils = {
    /**
     * Sanitize string by removing potentially dangerous characters
     */
    sanitize(str) {
        return str.replace(/[<>]/g, '').trim();
    },
    /**
     * Truncate string to specified length with ellipsis
     */
    truncate(str, maxLength, suffix = '...') {
        if (str.length <= maxLength)
            return str;
        return str.substr(0, maxLength - suffix.length) + suffix;
    },
    /**
     * Convert string to title case
     */
    toTitleCase(str) {
        return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    },
    /**
     * Generate URL-friendly slug from string
     */
    generateSlug(str) {
        return str
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },
    /**
     * Capitalize first letter of string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    /**
     * Extract domain from email address
     */
    extractDomain(email) {
        const parts = email.split('@');
        return parts.length === 2 ? parts[1].toLowerCase() : '';
    },
};
/**
 * Format utilities for displaying data
 */
exports.formatUtils = {
    /**
     * Format currency amount
     */
    currency(amount, currency = 'USD', locale = 'en-US') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency
        }).format(amount);
    },
    /**
     * Format bytes to human-readable size
     */
    bytes(bytes, decimals = 2) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
    /**
     * Format time difference in human-readable format
     */
    timeAgo(date) {
        const now = new Date();
        const past = typeof date === 'string' ? new Date(date) : date;
        const diffMs = now.getTime() - past.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMinutes < 1)
            return 'just now';
        if (diffMinutes < 60)
            return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        if (diffHours < 24)
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 30)
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return past.toLocaleDateString();
    },
};
/**
 * Async utilities for asynchronous operations
 */
exports.asyncUtils = {
    /**
     * Delay execution for specified milliseconds
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    /**
     * Retry function with exponential backoff
     */
    async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (attempt === maxRetries - 1) {
                    throw lastError;
                }
                const delayMs = baseDelay * Math.pow(2, attempt);
                await this.delay(delayMs);
            }
        }
        throw lastError;
    },
    /**
     * Debounce function execution
     */
    debounce(func, wait) {
        let timeout = null;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                func(...args);
            };
            if (timeout)
                clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    /**
     * Throttle function execution
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
};
// Export all utils
exports.utils = {
    object: exports.objectUtils,
    string: exports.stringUtils,
    format: exports.formatUtils,
    async: exports.asyncUtils,
};
//# sourceMappingURL=index.js.map