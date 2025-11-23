import * as crypto from 'crypto';
export const generateVerificationCode = (length = 6) => {
    const codes = [];
    while (codes.length < 1) {
        const code = Math.floor(Math.random() * Math.pow(10, length))
            .toString()
            .padStart(length, '0');
        if (!codes.includes(code)) {
            codes.push(code);
        }
    }
    return codes[0];
};
export const validatePassword = (password) => {
    if (password.length < 8) {
        return {
            isValid: false,
            message: 'Password must be at least 8 characters long'
        };
    }
    if (!/[A-Z]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one uppercase letter'
        };
    }
    if (!/[a-z]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one lowercase letter'
        };
    }
    if (!/[0-9]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one number'
        };
    }
    if (!/[!@#$%^&*]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one special character (!@#$%^&*)'
        };
    }
    return { isValid: true };
};
export const generateBackupCodes = (count = 8) => {
    const codes = [];
    const codeLength = 8;
    while (codes.length < count) {
        const code = crypto
            .randomBytes(4)
            .toString('hex')
            .toUpperCase()
            .slice(0, codeLength);
        if (!codes.includes(code)) {
            codes.push(code);
        }
    }
    return codes;
};
export const generateToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};
export const compareHashes = (a, b) => {
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
};
//# sourceMappingURL=auth.utils.js.map