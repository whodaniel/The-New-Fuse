var SecurityUtils = /** @class */ (function () {
    function SecurityUtils() {
    }
    SecurityUtils.generateRandomString = function (length) {
        var charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var result = '';
        var values = new Uint32Array(length);
        crypto.getRandomValues(values);
        for (var i = 0; i < length; i++) {
            result += charset[values[i] % charset.length];
        }
        return result;
    };
    SecurityUtils.generateUUID = function () {
        return crypto.randomUUID();
    };
    SecurityUtils.hashString = function (str) {
        var encoder = new TextEncoder();
        var data = encoder.encode(str);
        return crypto.subtle.digest('SHA-256', data).then(function (buffer) {
            return Array.from(new Uint8Array(buffer))
                .map(function (b) { return b.toString(16).padStart(2, '0'); })
                .join('');
        });
    };
    SecurityUtils.sanitizeHTML = function (html) {
        var element = document.createElement('div');
        element.textContent = html;
        return element.innerHTML;
    };
    SecurityUtils.validatePassword = function (password) {
        var errors = [];
        var minLength = 8;
        var hasUpperCase = /[A-Z]/.test(password);
        var hasLowerCase = /[a-z]/.test(password);
        var hasNumbers = /\d/.test(password);
        var hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        if (password.length < minLength) {
            errors.push("Password must be at least ".concat(minLength, " characters long"));
        }
        if (!hasUpperCase) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!hasLowerCase) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!hasNumbers) {
            errors.push('Password must contain at least one number');
        }
        if (!hasSpecialChar) {
            errors.push('Password must contain at least one special character');
        }
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    };
    SecurityUtils.maskSensitiveData = function (data, visibleChars) {
        if (visibleChars === void 0) { visibleChars = 4; }
        if (data.length <= visibleChars * 2) {
            return '*'.repeat(data.length);
        }
        var start = data.slice(0, visibleChars);
        var end = data.slice(-visibleChars);
        return "".concat(start).concat('*'.repeat(data.length - visibleChars * 2)).concat(end);
    };
    SecurityUtils.isValidJWT = function (token) {
        if (!token)
            return false;
        var parts = token.split('.');
        if (parts.length !== 3)
            return false;
        try {
            parts.forEach(function (part) {
                atob(part.replace(/-/g, '+').replace(/_/g, '/'));
            });
            return true;
        }
        catch (_a) {
            return false;
        }
    };
    SecurityUtils.parseJWT = function (token) {
        try {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(base64));
        }
        catch (_a) {
            return null;
        }
    };
    SecurityUtils.generateCSRFToken = function () {
        return this.generateRandomString(32);
    };
    SecurityUtils.validateEmail = function (email) {
        var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };
    SecurityUtils.encodeBase64 = function (str) {
        return btoa(str);
    };
    SecurityUtils.decodeBase64 = function (str) {
        return atob(str);
    };
    return SecurityUtils;
}());
export { SecurityUtils };
