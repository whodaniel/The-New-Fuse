/**
 * Frontend Input Sanitization and Security Utilities
 * Provides comprehensive client-side security measures
 */
var ClientSecurityUtils = /** @class */ (function () {
    function ClientSecurityUtils() {
    }
    /**
     * Sanitize HTML content to prevent XSS
     */
    ClientSecurityUtils.sanitizeHTML = function (html) {
        if (!html || typeof html !== 'string') {
            return '';
        }
        // Create a div element to safely parse HTML
        var div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    };
    /**
     * Sanitize text input
     */
    ClientSecurityUtils.sanitizeText = function (input, options) {
        if (options === void 0) { options = {}; }
        if (!input || typeof input !== 'string') {
            return '';
        }
        var sanitized = input;
        // Remove control characters
        sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        // Strip or escape HTML
        if (options.stripHtml) {
            sanitized = sanitized.replace(/<[^>]*>/g, '');
        }
        else if (options.escapeHtml) {
            sanitized = this.escapeHtml(sanitized);
        }
        // Apply character restrictions
        if (options.allowedChars) {
            var regex = new RegExp("[^".concat(options.allowedChars, "]"), 'g');
            sanitized = sanitized.replace(regex, '');
        }
        // Apply length limit
        if (options.maxLength && sanitized.length > options.maxLength) {
            sanitized = sanitized.substring(0, options.maxLength);
        }
        // Trim whitespace
        if (options.trimWhitespace !== false) {
            sanitized = sanitized.trim();
        }
        return sanitized;
    };
    /**
     * Sanitize input for database use
     */
    ClientSecurityUtils.sanitizeForDatabase = function (input) {
        if (!input || typeof input !== 'string') {
            return '';
        }
        return input
            .replace(/'/g, "''") // Escape single quotes
            .replace(/"/g, '""') // Escape double quotes
            .replace(/\\/g, '\\\\') // Escape backslashes
            .replace(/\x00/g, '') // Remove null bytes
            .replace(/[\x0D\x0A]/g, '') // Remove CR/LF
            .trim()
            .substring(0, 10000);
    };
    /**
     * Sanitize file names
     */
    ClientSecurityUtils.sanitizeFileName = function (fileName) {
        if (!fileName || typeof fileName !== 'string') {
            return 'unnamed_file';
        }
        return fileName
            .replace(/[\/\\?%*:|"<>]/g, '_') // Replace dangerous characters
            .replace(/\.\./g, '_') // Remove path traversal
            .replace(/^\.*/, '') // Remove leading dots
            .substring(0, 255) // Limit length
            .trim() || 'unnamed_file';
    };
    /**
     * Sanitize URLs
     */
    ClientSecurityUtils.sanitizeUrl = function (url) {
        if (!url || typeof url !== 'string') {
            return '';
        }
        try {
            var parsed = new URL(url);
            // Only allow certain protocols
            var allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
            if (!allowedProtocols.includes(parsed.protocol)) {
                return '';
            }
            // Remove dangerous characters
            return parsed.toString()
                .replace(/[<>"']/g, '')
                .substring(0, 2048);
        }
        catch (_a) {
            return '';
        }
    };
    /**
     * Sanitize email addresses
     */
    ClientSecurityUtils.sanitizeEmail = function (email) {
        if (!email || typeof email !== 'string') {
            return '';
        }
        return email
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9@._+-]/g, '') // Only allow valid email characters
            .substring(0, 254); // Email length limit
    };
    /**
     * Sanitize phone numbers
     */
    ClientSecurityUtils.sanitizePhoneNumber = function (phone) {
        if (!phone || typeof phone !== 'string') {
            return '';
        }
        return phone
            .replace(/[^\d+\-().\s]/g, '') // Only allow digits and phone symbols
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim()
            .substring(0, 20);
    };
    /**
     * Validate and sanitize JSON
     */
    ClientSecurityUtils.sanitizeJSON = function (input) {
        if (!input || typeof input !== 'string') {
            return null;
        }
        try {
            var parsed = JSON.parse(input);
            return this.sanitizeObject(parsed);
        }
        catch (_a) {
            return null;
        }
    };
    /**
     * Recursively sanitize object properties
     */
    ClientSecurityUtils.sanitizeObject = function (obj) {
        var _this = this;
        if (obj === null || obj === undefined) {
            return obj;
        }
        if (typeof obj === 'string') {
            return this.sanitizeText(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(function (item) { return _this.sanitizeObject(item); });
        }
        if (typeof obj === 'object') {
            var sanitized = {};
            for (var _i = 0, _a = Object.entries(obj); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                var sanitizedKey = this.sanitizeText(key, { maxLength: 100 });
                if (sanitizedKey) {
                    sanitized[sanitizedKey] = this.sanitizeObject(value);
                }
            }
            return sanitized;
        }
        return obj;
    };
    /**
     * Escape HTML characters
     */
    ClientSecurityUtils.escapeHtml = function (text) {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
        };
        return text.replace(/[&<>"'/]/g, function (m) { return map[m]; });
    };
    /**
     * Generate CSRF token
     */
    ClientSecurityUtils.generateCSRFToken = function () {
        var array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, function (byte) { return byte.toString(16).padStart(2, '0'); }).join('');
    };
    /**
     * Validate CSRF token
     */
    ClientSecurityUtils.validateCSRFToken = function (token) {
        return typeof token === 'string' && token.length >= 32 && /^[a-f0-9]+$/i.test(token);
    };
    /**
     * Create secure form data
     */
    ClientSecurityUtils.createSecureFormData = function (data) {
        var formData = new FormData();
        for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            var sanitizedKey = this.sanitizeText(key, { maxLength: 100 });
            if (sanitizedKey && value !== undefined && value !== null) {
                if (value instanceof File) {
                    formData.append(sanitizedKey, value);
                }
                else {
                    formData.append(sanitizedKey, this.sanitizeText(String(value)));
                }
            }
        }
        return formData;
    };
    /**
     * Sanitize query parameters
     */
    ClientSecurityUtils.sanitizeQueryParams = function (params) {
        var sanitized = {};
        for (var _i = 0, _a = Object.entries(params); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            var sanitizedKey = this.sanitizeText(key, { maxLength: 100 });
            var sanitizedValue = this.sanitizeText(value, { maxLength: 1000 });
            if (sanitizedKey && sanitizedValue) {
                sanitized[sanitizedKey] = sanitizedValue;
            }
        }
        return sanitized;
    };
    /**
     * Secure local storage
     */
    ClientSecurityUtils.setSecureItem = function (key, value) {
        try {
            var sanitizedKey = this.sanitizeText(key, { maxLength: 100 });
            var serialized = JSON.stringify(value);
            var encoded = btoa(encoded); // Basic encoding (use encryption in production)
            localStorage.setItem(sanitizedKey, encoded);
        }
        catch (error) {
            console.warn('Failed to store item securely:', error);
        }
    };
    ClientSecurityUtils.getSecureItem = function (key) {
        try {
            var sanitizedKey = this.sanitizeText(key, { maxLength: 100 });
            var encoded = localStorage.getItem(sanitizedKey);
            if (!encoded)
                return null;
            var decoded = atob(encoded);
            return JSON.parse(decoded);
        }
        catch (error) {
            console.warn('Failed to retrieve item securely:', error);
            return null;
        }
    };
    ClientSecurityUtils.removeSecureItem = function (key) {
        var sanitizedKey = this.sanitizeText(key, { maxLength: 100 });
        localStorage.removeItem(sanitizedKey);
    };
    /**
     * Content Security Policy utilities
     */
    ClientSecurityUtils.applyCSP = function () {
        var meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self' wss: https:",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ].join('; ');
        document.head.appendChild(meta);
    };
    /**
     * Secure random string generation
     */
    ClientSecurityUtils.generateSecureRandom = function (length) {
        if (length === void 0) { length = 32; }
        var array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, function (byte) {
            return 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[byte % 62];
        }).join('');
    };
    /**
     * Password strength validation
     */
    ClientSecurityUtils.validatePasswordStrength = function (password) {
        var feedback = [];
        var score = 0;
        // Length check
        if (password.length < 8) {
            feedback.push('Password must be at least 8 characters long');
        }
        else if (password.length >= 12) {
            score += 2;
        }
        else {
            score += 1;
        }
        // Character variety checks
        if (/[a-z]/.test(password))
            score += 1;
        else
            feedback.push('Add lowercase letters');
        if (/[A-Z]/.test(password))
            score += 1;
        else
            feedback.push('Add uppercase letters');
        if (/\d/.test(password))
            score += 1;
        else
            feedback.push('Add numbers');
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password))
            score += 1;
        else
            feedback.push('Add special characters');
        // Common password check
        var commonPasswords = [
            'password', '123456', 'qwerty', 'admin', 'letmein',
            'welcome', 'monkey', 'dragon', 'master', 'shadow'
        ];
        if (commonPasswords.includes(password.toLowerCase())) {
            feedback.push('Avoid common passwords');
            score = 0;
        }
        // Repetition check
        if (/(.)\1{2,}/.test(password)) {
            feedback.push('Avoid repeated characters');
            score = Math.max(0, score - 1);
        }
        return {
            isValid: score >= 4 && feedback.length === 0,
            score: Math.min(score, 5),
            feedback: feedback
        };
    };
    return ClientSecurityUtils;
}());
export { ClientSecurityUtils };
// React hook for secure input handling
export function useSecureInput(initialValue, options) {
    if (initialValue === void 0) { initialValue = ''; }
    if (options === void 0) { options = {}; }
    var _a = React.useState(initialValue), value = _a[0], setValue = _a[1];
    var handleChange = function (event) {
        var sanitized = ClientSecurityUtils.sanitizeText(event.target.value, options);
        setValue(sanitized);
    };
    return {
        value: value,
        setValue: setValue,
        handleChange: handleChange,
        reset: function () { return setValue(initialValue); }
    };
}
// Secure component wrapper
export function withInputSanitization(Component) {
    return function SanitizedComponent(props) {
        // Apply CSP
        React.useEffect(function () {
            ClientSecurityUtils.applyCSP();
        }, []);
        return React.createElement(Component, props);
    };
}
