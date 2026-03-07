
export {}
exports.validateEmail = exports.sanitizeInput = void 0;
function sanitizeInput(input: string): any {
    return input.trim().replace(/[<>]/g, '');
}
exports.sanitizeInput = sanitizeInput;
function validateEmail(email: string): any {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
exports.validateEmail = validateEmail;
//# sourceMappingURL=validation.js.mapexport {};
