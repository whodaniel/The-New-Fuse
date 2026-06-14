"use strict";
/**
 * Unified Validation Utilities
 * Consolidates all validation logic across the monorepo
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmail = exports.isValidJson = exports.isValidPhone = exports.isValidUuid = exports.isValidUrl = exports.isValidEmail = exports.Validators = void 0;
/**
 * Centralized validator class with common validation patterns
 */
class Validators {
    static { this.EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; }
    static { this.UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i; }
    static { this.URL_REGEX = /^https?:\/\/.+/; }
    /**
     * Validate email address format
     */
    static email(value) {
        const isValid = this.EMAIL_REGEX.test(value);
        return {
            isValid,
            error: isValid ? undefined : 'Invalid email address',
        };
    }
    /**
     * Validate URL format
     */
    static url(value) {
        try {
            new URL(value);
            return { isValid: true };
        }
        catch {
            return { isValid: false, error: 'Invalid URL' };
        }
    }
    /**
     * Validate required field
     */
    static required(value) {
        const isValid = value !== undefined && value !== null && value !== '';
        return {
            isValid,
            error: isValid ? undefined : 'This field is required',
        };
    }
    /**
     * Validate minimum length
     */
    static minLength(value, min) {
        const isValid = value.length >= min;
        return {
            isValid,
            error: isValid ? undefined : `Minimum length is ${min} characters`,
        };
    }
    /**
     * Validate maximum length
     */
    static maxLength(value, max) {
        const isValid = value.length <= max;
        return {
            isValid,
            error: isValid ? undefined : `Maximum length is ${max} characters`,
        };
    }
    /**
     * Validate UUID format
     */
    static uuid(value) {
        const isValid = this.UUID_REGEX.test(value);
        return {
            isValid,
            error: isValid ? undefined : 'Invalid UUID format',
        };
    }
    /**
     * Validate numeric value
     */
    static numeric(value) {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        const isValid = !isNaN(num) && isFinite(num);
        return {
            isValid,
            error: isValid ? undefined : 'Must be a valid number',
        };
    }
    /**
     * Validate integer value
     */
    static integer(value) {
        const num = typeof value === 'string' ? Number(value) : value;
        const isValid = Number.isInteger(num);
        return {
            isValid,
            error: isValid ? undefined : 'Must be an integer',
        };
    }
    /**
     * Validate minimum value
     */
    static min(value, min) {
        const isValid = value >= min;
        return {
            isValid,
            error: isValid ? undefined : `Minimum value is ${min}`,
        };
    }
    /**
     * Validate maximum value
     */
    static max(value, max) {
        const isValid = value <= max;
        return {
            isValid,
            error: isValid ? undefined : `Maximum value is ${max}`,
        };
    }
    /**
     * Validate pattern match
     */
    static pattern(value, pattern, errorMessage) {
        const isValid = pattern.test(value);
        return {
            isValid,
            error: isValid ? undefined : (errorMessage || 'Invalid format'),
        };
    }
    /**
     * Validate phone number
     */
    static phone(value) {
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        const isValid = phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
        return {
            isValid,
            error: isValid ? undefined : 'Invalid phone number',
        };
    }
    /**
     * Validate JSON string
     */
    static json(value) {
        try {
            JSON.parse(value);
            return { isValid: true };
        }
        catch {
            return { isValid: false, error: 'Invalid JSON' };
        }
    }
}
exports.Validators = Validators;
// Convenience functions for backward compatibility
const isValidEmail = (email) => Validators.email(email).isValid;
exports.isValidEmail = isValidEmail;
const isValidUrl = (url) => Validators.url(url).isValid;
exports.isValidUrl = isValidUrl;
const isValidUuid = (uuid) => Validators.uuid(uuid).isValid;
exports.isValidUuid = isValidUuid;
const isValidPhone = (phone) => Validators.phone(phone).isValid;
exports.isValidPhone = isValidPhone;
const isValidJson = (json) => Validators.json(json).isValid;
exports.isValidJson = isValidJson;
// Legacy function names for compatibility
exports.validateEmail = exports.isValidEmail;
//# sourceMappingURL=index.js.map