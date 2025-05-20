export class SecurityUtils {
    static generateRandomString(length) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const values = new Uint32Array(length);
        crypto.getRandomValues(values);
        for (let i = 0; i < length; i++) {
            result += charset[values[i] % charset.length];
        }
        return result;
    }
    static generateUUID() {
        return crypto.randomUUID();
    }
    static hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        return crypto.subtle.digest('SHA-256', data).then(buffer => {
            return Array.from(new Uint8Array(buffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        });
    }
    static sanitizeHTML(html) {
        const element = document.createElement('div');
        element.textContent = html;
        return element.innerHTML;
    }
    static validatePassword(password) {
        const errors = [];
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        if (password.length < minLength) {
            errors.push(`Password must be at least ${minLength} characters long`);
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
            errors
        };
    }
    static maskSensitiveData(data, visibleChars = 4) {
        if (data.length <= visibleChars * 2) {
            return '*'.repeat(data.length);
        }
        const start = data.slice(0, visibleChars);
        const end = data.slice(-visibleChars);
        return `${start}${'*'.repeat(data.length - visibleChars * 2)}${end}`;
    }
    static isValidJWT(token) {
        if (!token)
            return false;
        const parts = token.split('.');
        if (parts.length !== 3)
            return false;
        try {
            parts.forEach(part => {
                atob(part.replace(/-/g, '+').replace(/_/g, '/'));
            });
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    static parseJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(base64));
        }
        catch (_a) {
            return null;
        }
    }
    static generateCSRFToken() {
        return this.generateRandomString(32);
    }
    static validateEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }
    static encodeBase64(str) {
        return btoa(str);
    }
    static decodeBase64(str) {
        return atob(str);
    }
}
//# sourceMappingURL=security.js.map