"use strict";
// Export shared validators
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidDate = exports.isNumeric = exports.isValidUrl = exports.isStrongPassword = exports.isEmail = void 0;
// Common validation functions
const isEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
};
exports.isEmail = isEmail;
const isStrongPassword = (value) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return passwordRegex.test(value);
};
exports.isStrongPassword = isStrongPassword;
const isValidUrl = (value) => {
    try {
        new URL(value);
        return true;
    }
    catch {
        return false;
    }
};
exports.isValidUrl = isValidUrl;
const isNumeric = (value) => {
    return !isNaN(parseFloat(value));
};
exports.isNumeric = isNumeric;
const isValidDate = (value) => {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
};
exports.isValidDate = isValidDate;
//# sourceMappingURL=index.js.map