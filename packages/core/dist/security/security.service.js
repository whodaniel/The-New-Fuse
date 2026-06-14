var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SecurityService_1;
import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger.js';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';
let SecurityService = SecurityService_1 = class SecurityService {
    constructor(config) {
        this.config = config;
        this.logger = new Logger(SecurityService_1.name);
        this.saltRounds = 10;
        this.algorithm = 'aes-256-gcm';
    }
    async hashPassword(password) {
        try {
            return await bcrypt.hash(password, this.saltRounds);
        }
        catch (error) {
            this.logger.error('Password hashing failed:', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    async comparePassword(plaintext, hash) {
        try {
            return await bcrypt.compare(plaintext, hash);
        }
        catch (error) {
            this.logger.error('Password comparison failed:', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    encryptText(text) {
        try {
            const iv = crypto.randomBytes(12);
            if (!this.config.jwtSecret) {
                throw new Error('JWT secret is not configured');
            }
            const key = crypto.scryptSync(this.config.jwtSecret, 'salt', 32);
            const cipher = crypto.createCipheriv(this.algorithm, key, iv);
            let encryptedData = cipher.update(text, 'utf8', 'hex');
            encryptedData += cipher.final('hex');
            const authTag = cipher.getAuthTag().toString('hex');
            return {
                encryptedData,
                iv: iv.toString('hex'),
                authTag,
            };
        }
        catch (error) {
            this.logger.error('Encryption failed:', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    decryptText(encryptedData, iv, authTag) {
        try {
            if (!this.config.jwtSecret) {
                throw new Error('JWT secret is not configured');
            }
            const key = crypto.scryptSync(this.config.jwtSecret, 'salt', 32);
            const decipher = crypto.createDecipheriv(this.algorithm, key, Buffer.from(iv, 'hex'));
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            this.logger.error('Decryption failed:', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    sanitizeInput(input) {
        try {
            return sanitizeHtml(input, {
                allowedTags: ['b', 'i', 'em', 'strong', 'a'],
                allowedAttributes: {
                    a: ['href'],
                },
            });
        }
        catch (error) {
            this.logger.error('Input sanitization failed:', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    generateToken(length) {
        try {
            return crypto.randomBytes(length).toString('hex');
        }
        catch (error) {
            this.logger.error('Token generation failed:', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    validatePassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
};
SecurityService = SecurityService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Object])
], SecurityService);
export { SecurityService };
//# sourceMappingURL=security.service.js.map