// Export shared validators
// Common validation functions
export const isEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
};
export const isStrongPassword = (value) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return passwordRegex.test(value);
};
export const isValidUrl = (value) => {
    try {
        new URL(value);
        return true;
    }
    catch {
        return false;
    }
};
export const isNumeric = (value) => {
    return !isNaN(parseFloat(value));
};
export const isValidDate = (value) => {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
};
//# sourceMappingURL=index.js.map