"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var WebhookSecurityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookSecurityService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let WebhookSecurityService = WebhookSecurityService_1 = class WebhookSecurityService {
    logger = new common_1.Logger(WebhookSecurityService_1.name);
    async validateSignature(payload, signature, config) {
        try {
            const expectedSignature = this.generateSignature(payload, config.secret, config.algorithm);
            // Handle different signature formats
            const normalizedSignature = this.normalizeSignature(signature, config.algorithm);
            const normalizedExpected = this.normalizeSignature(expectedSignature, config.algorithm);
            // Use timing-safe comparison to prevent timing attacks
            return this.timingSafeEqual(normalizedSignature, normalizedExpected);
        }
        catch (error) {
            this.logger.error('Failed to validate webhook signature', error);
            return false;
        }
    }
    generateSignature(payload, secret, algorithm) {
        const hmac = crypto.createHmac(algorithm, secret);
        hmac.update(payload, 'utf8');
        return hmac.digest('hex');
    }
    normalizeSignature(signature, algorithm) {
        // Remove common prefixes
        const cleanSignature = signature
            .replace(/^sha256=/, '')
            .replace(/^sha1=/, '')
            .replace(/^v1,/, '') // Stripe format
            .toLowerCase();
        return cleanSignature;
    }
    timingSafeEqual(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
    }
    validateStripeSignature(payload, signature, secret, tolerance = 300) {
        try {
            const elements = signature.split(',');
            const signatureHash = elements.find(element => element.startsWith('v1='))?.substring(3);
            const timestamp = elements.find(element => element.startsWith('t='))?.substring(2);
            if (!signatureHash || !timestamp) {
                return false;
            }
            // Check timestamp tolerance
            const timestampNum = parseInt(timestamp, 10);
            const now = Math.floor(Date.now() / 1000);
            if (Math.abs(now - timestampNum) > tolerance) {
                this.logger.warn('Stripe webhook timestamp outside tolerance');
                return false;
            }
            // Verify signature
            const expectedSignature = this.generateSignature(`${timestamp}.${payload}`, secret, 'sha256');
            return this.timingSafeEqual(signatureHash, expectedSignature);
        }
        catch (error) {
            this.logger.error('Failed to validate Stripe signature', error);
            return false;
        }
    }
    validateHubSpotSignature(payload, signature, secret) {
        try {
            const expectedSignature = this.generateSignature(payload + secret, '', 'sha256');
            return this.timingSafeEqual(signature, expectedSignature);
        }
        catch (error) {
            this.logger.error('Failed to validate HubSpot signature', error);
            return false;
        }
    }
    validateSalesforceSignature(payload, signature, secret, url) {
        try {
            const data = payload + url;
            const expectedSignature = crypto.createHmac('sha256', secret).update(data, 'utf8').digest('base64');
            return this.timingSafeEqual(signature, expectedSignature);
        }
        catch (error) {
            this.logger.error('Failed to validate Salesforce signature', error);
            return false;
        }
    }
    validatePayPalSignature(payload, headers, webhookId, secret) {
        try {
            const authAlgo = headers['paypal-auth-algo'] || 'SHA256withRSA';
            const transmission = headers['paypal-transmission-id'];
            const certId = headers['paypal-cert-id'];
            const transmissionSig = headers['paypal-transmission-sig'];
            const timestamp = headers['paypal-transmission-time'];
            if (!transmission || !certId || !transmissionSig || !timestamp) {
                return false;
            }
            // For simplified validation, we'll use HMAC approach
            // In production, you'd want to use PayPal's SDK for proper RSA validation
            const expectedData = `${authAlgo}|${transmission}|${certId}|${timestamp}|${webhookId}|${crypto.createHash('sha256').update(payload).digest('base64')}`;
            const expectedSignature = crypto.createHmac('sha256', secret).update(expectedData, 'utf8').digest('base64');
            return this.timingSafeEqual(transmissionSig, expectedSignature);
        }
        catch (error) {
            this.logger.error('Failed to validate PayPal signature', error);
            return false;
        }
    }
    validateSquareSignature(payload, signature, secret, url) {
        try {
            const data = url + payload;
            const expectedSignature = crypto.createHmac('sha1', secret).update(data, 'utf8').digest('base64');
            return this.timingSafeEqual(signature, expectedSignature);
        }
        catch (error) {
            this.logger.error('Failed to validate Square signature', error);
            return false;
        }
    }
    validatePipedriveSignature(payload, signature, secret) {
        try {
            const expectedSignature = crypto.createHmac('sha1', secret).update(payload, 'utf8').digest('hex');
            return this.timingSafeEqual(signature, expectedSignature);
        }
        catch (error) {
            this.logger.error('Failed to validate Pipedrive signature', error);
            return false;
        }
    }
    validateQuickBooksSignature(payload, signature, secret) {
        try {
            const expectedSignature = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');
            return this.timingSafeEqual(signature, expectedSignature);
        }
        catch (error) {
            this.logger.error('Failed to validate QuickBooks signature', error);
            return false;
        }
    }
    validateZapierSignature(payload, signature, secret) {
        try {
            const expectedSignature = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
            return this.timingSafeEqual(signature, expectedSignature);
        }
        catch (error) {
            this.logger.error('Failed to validate Zapier signature', error);
            return false;
        }
    }
    validateWorkatoSignature(payload, signature, secret, timestamp) {
        try {
            const data = `${timestamp}.${payload}`;
            const expectedSignature = crypto.createHmac('sha256', secret).update(data, 'utf8').digest('hex');
            const formattedSignature = `v1=${expectedSignature}`;
            return this.timingSafeEqual(signature, formattedSignature);
        }
        catch (error) {
            this.logger.error('Failed to validate Workato signature', error);
            return false;
        }
    }
    validatePowerAutomateSignature(payload, signature, secret) {
        try {
            const expectedSignature = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');
            return this.timingSafeEqual(signature, expectedSignature);
        }
        catch (error) {
            this.logger.error('Failed to validate Power Automate signature', error);
            return false;
        }
    }
    generateWebhookSecret(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    encryptSecret(secret, key) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher('aes-256-cbc', key);
            let encrypted = cipher.update(secret, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return `${iv.toString('hex')}:${encrypted}`;
        }
        catch (error) {
            this.logger.error('Failed to encrypt secret', error);
            throw error;
        }
    }
    decryptSecret(encryptedSecret, key) {
        try {
            const [ivHex, encrypted] = encryptedSecret.split(':');
            const iv = Buffer.from(ivHex, 'hex');
            const decipher = crypto.createDecipher('aes-256-cbc', key);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            this.logger.error('Failed to decrypt secret', error);
            throw error;
        }
    }
    validateTimestamp(timestamp, tolerance = 300) {
        try {
            const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
            const now = Math.floor(Date.now() / 1000);
            return Math.abs(now - timestampNum) <= tolerance;
        }
        catch (error) {
            this.logger.error('Failed to validate timestamp', error);
            return false;
        }
    }
    sanitizePayload(payload) {
        // Remove potentially dangerous properties
        const sanitized = JSON.parse(JSON.stringify(payload));
        // Remove common XSS vectors
        if (typeof sanitized === 'object' && sanitized !== null) {
            this.recursiveSanitize(sanitized);
        }
        return sanitized;
    }
    recursiveSanitize(obj) {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                // Basic XSS protection
                obj[key] = obj[key]
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '');
            }
            else if (typeof obj[key] === 'object' && obj[key] !== null) {
                this.recursiveSanitize(obj[key]);
            }
        }
    }
    validatePayloadSize(payload, maxSize = 1024 * 1024) {
        // Default max size: 1MB
        const payloadSize = Buffer.byteLength(payload, 'utf8');
        return payloadSize <= maxSize;
    }
    rateLimitCheck(identifier, windowMs = 60000, maxRequests = 100) {
        // Simple in-memory rate limiting
        // In production, use Redis or similar distributed cache
        const now = Date.now();
        const key = `webhook_rate_limit_${identifier}`;
        // This would be implemented with a proper rate limiting solution
        // For now, return true to allow all requests
        return true;
    }
};
exports.WebhookSecurityService = WebhookSecurityService;
exports.WebhookSecurityService = WebhookSecurityService = WebhookSecurityService_1 = __decorate([
    (0, common_1.Injectable)()
], WebhookSecurityService);
