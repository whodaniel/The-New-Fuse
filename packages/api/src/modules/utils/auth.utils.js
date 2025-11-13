import * as bcrypt from 'bcrypt';
export async function hashPassword(password) {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
}
export async function comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}
export function generateRandomToken(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
export function sanitizeInput(input) {
    return input.trim().replace(/[<>]/g, '');
}
//# sourceMappingURL=auth.utils.js.map