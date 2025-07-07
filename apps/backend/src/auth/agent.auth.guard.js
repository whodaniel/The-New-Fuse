"use strict";
/**
 * Agent Authentication Guard
 * Protects routes that require agent-specific authentication
 * Handles both JWT tokens and agent-specific API keys
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
let AgentAuthGuard = AgentAuthGuard_1 = class AgentAuthGuard {
    jwtService;
    logger = new common_1.Logger(AgentAuthGuard_1.name);
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    /**
     * Determines if the current request is authorized for agent access
     * @param context Execution context
     * @returns Promise<boolean> indicating if request is authorized
     */
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        try {
            // Try to authenticate with JWT token first
            const token = this.extractTokenFromHeader(request);
            if (token) {
                return await this.validateJwtToken(token, request);
            }
            // Try to authenticate with agent API key
            const apiKey = this.extractApiKeyFromHeader(request);
            if (apiKey) {
                return await this.validateAgentApiKey(apiKey, request);
            }
            // No valid authentication method found
            this.logger.debug('No valid authentication credentials found');
            throw new common_1.UnauthorizedException('Agent authentication required');
        }
        catch (error) {
            this.logger.debug(`Agent authentication failed: ${error.message}`);
            throw new common_1.UnauthorizedException(`Agent authentication failed: ${error.message}`);
        }
    }
    /**
     * Extract JWT token from Authorization header
     * @param request HTTP request object
     * @returns string | null
     */
    extractTokenFromHeader(request) {
        const authorization = request.headers.authorization;
        if (!authorization)
            return null;
        const [type, token] = authorization.split(' ');
        return type === 'Bearer' ? token : null;
    }
    /**
     * Extract API key from X-Agent-API-Key header
     * @param request HTTP request object
     * @returns string | null
     */
    extractApiKeyFromHeader(request) {
        return request.headers['x-agent-api-key'] || request.headers['x-api-key'] || null;
    }
    /**
     * Validate JWT token and extract agent information
     * @param token JWT token
     * @param request HTTP request object
     * @returns Promise<boolean>
     */
    async validateJwtToken(token, request) {
        try {
            const payload = await this.jwtService.verifyAsync(token);
            // Ensure this is an agent token
            if (!payload.agentId || payload.type !== 'agent') {
                throw new common_1.UnauthorizedException('Invalid agent token');
            }
            // Attach agent information to request
            request.agent = {
                id: payload.agentId,
                agencyId: payload.agencyId,
                capabilities: payload.capabilities || [],
                permissions: payload.permissions || [],
            };
            this.logger.debug(`Agent authenticated via JWT: ${payload.agentId}`);
            return true;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid or expired agent token');
        }
    }
    /**
     * Validate agent API key
     * @param apiKey Agent API key
     * @param request HTTP request object
     * @returns Promise<boolean>
     */
    async validateAgentApiKey(apiKey, request) {
        // In a real implementation, this would validate against a database
        // For now, we'll implement basic validation logic
        if (!apiKey || apiKey.length < 32) {
            throw new common_1.UnauthorizedException('Invalid agent API key format');
        }
        // TODO: Implement actual API key validation against database
        // This should check if the API key exists and is active
        // Mock validation for development
        if (apiKey.startsWith('agent_') && apiKey.length >= 32) {
            // Extract agent info from API key (in real implementation, query database)
            const agentId = apiKey.split('_')[1] || 'unknown';
            request.agent = {
                id: agentId,
                agencyId: 'default', // Would come from database
                capabilities: ['read', 'write'], // Would come from database
                permissions: ['agent:communicate'], // Would come from database
                apiKey: apiKey,
            };
            this.logger.debug(`Agent authenticated via API key: ${agentId}`);
            return true;
        }
        throw new common_1.UnauthorizedException('Invalid agent API key');
    }
};
exports.AgentAuthGuard = AgentAuthGuard;
exports.AgentAuthGuard = AgentAuthGuard = AgentAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], AgentAuthGuard);
