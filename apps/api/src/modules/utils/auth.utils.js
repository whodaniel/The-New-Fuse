var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
let AuthUtils = class AuthUtils {
    /**
     * Hash a password using bcrypt
     */
    static async hashPassword(password) {
        const saltRounds = 12; // Recommended rounds for bcrypt
        return bcrypt.hash(password, saltRounds);
    }
    /**
     * Verify a password against its hash
     */
    static async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
    /**
     * Generate a random salt
     */
    static async generateSalt(rounds = 12) {
        return bcrypt.genSalt(rounds);
    }
    /**
     * Hash a password with a custom salt
     */
    static async hashPasswordWithSalt(password, salt) {
        return bcrypt.hash(password, salt);
    }
    /**
     * Generate a secure random token
     */
    static generateSecureToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < length; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }
    /**
     * Generate a cryptographically secure random token
     */
    static generateSecureTokenCrypto(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < length; i++) {
            token += chars.charAt(array[i] % chars.length);
        }
        return token;
    }
    /**
     * Validate password strength
     */
    static validatePasswordStrength(password) {
        const errors = [];
        let score = 0;
        // Length check
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        else if (password.length >= 12) {
            score += 2;
        }
        else {
            score += 1;
        }
        // Character variety checks
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        else {
            score += 1;
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        else {
            score += 1;
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        else {
            score += 1;
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        else {
            score += 1;
        }
        // Check for common patterns
        if (/(.)\1{2,}/.test(password)) {
            errors.push('Password must not contain repeated characters');
            score -= 1;
        }
        if (/123|abc|qwerty/i.test(password)) {
            errors.push('Password must not contain common sequences');
            score -= 1;
        }
        return {
            isValid: errors.length === 0,
            errors,
            score: Math.max(0, score)
        };
    }
};
AuthUtils = __decorate([
    Injectable()
], AuthUtils);
export { AuthUtils };
// Export the hashPassword function for backward compatibility
export const hashPassword = AuthUtils.hashPassword;
export const verifyPassword = AuthUtils.verifyPassword;
export const generateSalt = AuthUtils.generateSalt;
export const hashPasswordWithSalt = AuthUtils.hashPasswordWithSalt;
export const generateSecureToken = AuthUtils.generateSecureToken;
export const generateSecureTokenCrypto = AuthUtils.generateSecureTokenCrypto;
export const validatePasswordStrength = AuthUtils.validatePasswordStrength;
//# sourceMappingURL=auth.utils.js.map