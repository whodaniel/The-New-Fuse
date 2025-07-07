"use strict";
/**
 * Agent JWT Strategy
 *
 * This strategy handles JWT authentication specifically for AI agents
 * in The New Fuse multi-agent communication system.
 *
 * Agents use a different authentication flow than regular users,
 * with special claims and validation requirements.
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
var AgentJwtStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentJwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
let AgentJwtStrategy = AgentJwtStrategy_1 = class AgentJwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'agent-jwt') {
    configService;
    authService;
    logger = new common_1.Logger(AgentJwtStrategy_1.name);
    constructor(configService, authService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_AGENT_SECRET', configService.get('JWT_SECRET')),
            audience: configService.get('JWT_AUDIENCE', 'the-new-fuse'),
            issuer: configService.get('JWT_ISSUER', 'the-new-fuse'),
        });
        this.configService = configService;
        this.authService = authService;
    }
    /**
     * Validate agent JWT payload
     * @param payload The decoded JWT payload
     * @returns Validated agent information
     */
    async validate(payload) {
        try {
            this.logger.debug(`Validating agent JWT for agent: ${payload.agentId}`);
            // Validate required fields
            if (!payload.sub || !payload.agentId || !payload.agentType) {
                this.logger.warn('Invalid agent JWT payload: missing required fields');
                throw new common_1.UnauthorizedException('Invalid agent token: missing required fields');
            }
            // Validate agent ID matches sub
            if (payload.sub !== payload.agentId) {
                this.logger.warn(`Agent ID mismatch: sub=${payload.sub}, agentId=${payload.agentId}`);
                throw new common_1.UnauthorizedException('Invalid agent token: ID mismatch');
            }
            // Validate issuer and audience
            if (payload.issuer && payload.issuer !== this.configService.get('JWT_ISSUER', 'the-new-fuse')) {
                this.logger.warn(`Invalid token issuer: ${payload.issuer}`);
                throw new common_1.UnauthorizedException('Invalid agent token: wrong issuer');
            }
            if (payload.audience && payload.audience !== this.configService.get('JWT_AUDIENCE', 'the-new-fuse')) {
                this.logger.warn(`Invalid token audience: ${payload.audience}`);
                throw new common_1.UnauthorizedException('Invalid agent token: wrong audience');
            }
            // Validate agent exists and is active (if auth service provides this)
            if (this.authService.validateAgent) {
                const isValidAgent = await this.authService.validateAgent(payload.agentId);
                if (!isValidAgent) {
                    this.logger.warn(`Agent validation failed for: ${payload.agentId}`);
                    throw new common_1.UnauthorizedException('Agent not found or inactive');
                }
            }
            // Return agent information for use in request context
            const agentInfo = {
                id: payload.agentId,
                type: payload.agentType,
                capabilities: payload.capabilities || [],
                permissions: payload.permissions || [],
                sub: payload.sub,
                iat: payload.iat,
                exp: payload.exp,
            };
            this.logger.debug(`Agent authenticated successfully: ${payload.agentId}`);
            return agentInfo;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            this.logger.error(`Agent JWT validation error: ${error.message}`, error.stack);
            throw new common_1.UnauthorizedException('Agent authentication failed');
        }
    }
    /**
     * Extract agent token from custom header (alternative to Authorization header)
     * This method can be used if agents use a different header format
     */
    static extractAgentTokenFromHeader(req) {
        const agentHeader = req.headers['x-agent-authorization'];
        if (agentHeader && typeof agentHeader === 'string') {
            const [type, token] = agentHeader.split(' ');
            return type === 'Bearer' ? token : null;
        }
        return null;
    }
    /**
     * Alternative strategy configuration for custom token extraction
     */
    static createWithCustomExtractor() {
        return class extends AgentJwtStrategy_1 {
            constructor(configService, authService) {
                super(configService, authService);
                // Override the token extraction to support both standard and custom headers
                this.jwtFromRequest = passport_jwt_1.ExtractJwt.fromExtractors([
                    passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
                    AgentJwtStrategy_1.extractAgentTokenFromHeader,
                ]);
            }
        };
    }
};
exports.AgentJwtStrategy = AgentJwtStrategy;
exports.AgentJwtStrategy = AgentJwtStrategy = AgentJwtStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        auth_service_1.AuthService])
], AgentJwtStrategy);
