exports.validateEmail = exports.sanitizeInput = void 0;
function sanitizeInput(input) {
    return input.trim().replace(/[<>]/g, '');
}
exports.sanitizeInput = sanitizeInput;
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
exports.validateEmail = validateEmail;
export {};
//# sourceMappingURL=validation.js.mapexport {};
//# sourceMappingURL=validation.js.map