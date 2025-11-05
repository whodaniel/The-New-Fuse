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
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyAuth = exports.ApiKeyAuthGuard = void 0;
const common_1 = require("@nestjs/common");
/**
 * Simple API Key Authentication Guard.
 * Checks for 'X-API-Key' header and validates against a set of known keys.
 * Attaches agentId to the request object if authentication succeeds.
 */
let ApiKeyAuthGuard = class ApiKeyAuthGuard {
    validKeys;
    logger;
    constructor(validKeys, logger) {
        this.validKeys = validKeys;
        this.logger = logger;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const apiKey = request.headers['x-api-key'];
        if (!apiKey || typeof apiKey !== 'string') {
            this.logger.warn('Missing or invalid API Key header');
            response.status(401).json({ status: 'error', error: { message: 'Unauthorized: Missing API Key' } });
            return false;
        }
        if (!this.validKeys.has(apiKey)) {
            this.logger.warn(`Invalid API Key received: ${apiKey}`);
            response.status(403).json({ status: 'error', error: { message: 'Forbidden: Invalid API Key' } });
            return false;
        }
        // Attach agent identifier (could be derived from the key or a lookup)
        // For simplicity, using the key itself or a generic ID
        request.agentId = `agent-${apiKey.substring(0, 5)}`;
        this.logger.info(`Authenticated agent: ${request.agentId}`);
        return true;
    }
};
exports.ApiKeyAuthGuard = ApiKeyAuthGuard;
exports.ApiKeyAuthGuard = ApiKeyAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Set, Object])
], ApiKeyAuthGuard);
/**
 * Factory function for creating API Key Auth Guard (for backward compatibility)
 */
const apiKeyAuth = (validKeys, logger) => new ApiKeyAuthGuard(validKeys, logger);
exports.apiKeyAuth = apiKeyAuth;
//# sourceMappingURL=auth.js.map