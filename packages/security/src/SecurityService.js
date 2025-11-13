"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
const common_1 = require("@nestjs/common");
const EncryptionService_1 = require("./EncryptionService");
const auth_1 = require("./auth");
const audit_1 = require("../audit");
const rate_limiting_1 = require("./rate-limiting");
let SecurityService = class SecurityService {
    encryption;
    auth;
    audit;
    rateLimit;
    constructor(encryption, auth, audit, rateLimit) {
        this.encryption = encryption;
        this.auth = auth;
        this.audit = audit;
        this.rateLimit = rateLimit;
    }
    async encrypt(data) {
        const encryptedString = await this.encryption.encrypt(data, Buffer.from(process.env.ENCRYPTION_KEY || ''));
        // Parse the "iv:tag:encryptedData" format
        const parts = encryptedString.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const tag = Buffer.from(parts[1], 'hex');
        const encryptedData = Buffer.from(parts[2], 'hex');
        return {
            encrypted: encryptedData,
            iv,
            tag
        };
    }
    async decrypt(encryptedData, iv, tag, _salt) {
        // Reconstruct the "iv:tag:encryptedData" format
        const encryptedString = `${iv.toString('hex')}:${tag.toString('hex')}:${encryptedData.toString('hex')}`;
        return this.encryption.decrypt(encryptedString, Buffer.from(process.env.ENCRYPTION_KEY || ''));
    }
    async checkRateLimit(req) {
        const result = await this.rateLimit.isAllowed(req);
        return result.allowed;
    }
    async authenticate(req) {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token)
            return false;
        const payload = this.auth.verifyToken(token);
        return payload !== null;
    }
    async logAccess(req) {
        await this.audit.log({
            action: 'access',
            userId: req.user?.id,
            resourceId: req.path,
            resourceType: 'endpoint',
            details: {
                method: req.method,
                ip: req.ip
            }
        });
    }
    async validateRequest(request) {
        // Check rate limiting
        const rateLimitResult = await this.rateLimit.isAllowed(request.req);
        if (!rateLimitResult.allowed) {
            await this.audit.log({
                action: request.action || 'access_denied',
                resourceId: request.resource || request.req.path,
                resourceType: 'endpoint',
                details: {
                    reason: 'Rate limit exceeded',
                    ip: request.req.ip
                }
            });
            return false;
        }
        // Log successful access
        await this.audit.log({
            action: request.action || 'access',
            resourceId: request.resource || request.req.path,
            resourceType: 'endpoint',
            details: {
                ip: request.req.ip,
                userAgent: request.req.headers['user-agent']
            }
        });
        return true;
    }
};
exports.SecurityService = SecurityService;
exports.SecurityService = SecurityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [EncryptionService_1.EncryptionService,
        auth_1.AuthService, typeof (_a = typeof audit_1.AuditService !== "undefined" && audit_1.AuditService) === "function" ? _a : Object, rate_limiting_1.RateLimitingService])
], SecurityService);
//# sourceMappingURL=SecurityService.js.map