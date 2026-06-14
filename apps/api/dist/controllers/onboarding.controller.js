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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const auth_service_1 = require("../services/auth.service");
const isTruthy = (value) => {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return value > 0;
    if (typeof value !== 'string')
        return false;
    return ['1', 'true', 'yes', 'on', 'enabled'].includes(value.trim().toLowerCase());
};
let OnboardingController = class OnboardingController {
    constructor(authService, configService) {
        this.authService = authService;
        this.configService = configService;
    }
    async start(body, req) {
        const inviteOnly = isTruthy(this.configService.get('AUTH_INVITE_ONLY'));
        const inviteCode = this.pickFirst(body?.inviteCode, this.headerValue(req, 'x-invite-code'), this.queryValue(req, 'inviteCode'), this.queryValue(req, 'invite'));
        const onboardingToken = this.pickFirst(body?.onboardingToken, this.headerValue(req, 'x-onboarding-token'), this.queryValue(req, 'onboardingToken'), this.queryValue(req, 'token'));
        let inviteValidated = false;
        let inviteSource = null;
        if (inviteCode) {
            try {
                const validation = await this.authService.validateInviteCode(inviteCode);
                inviteValidated = true;
                inviteSource = validation.source;
            }
            catch {
                inviteValidated = false;
            }
        }
        const tokenValidated = this.validateOnboardingToken(onboardingToken);
        if (inviteOnly && !inviteValidated && !tokenValidated) {
            throw new common_1.ForbiddenException('Invite code or onboarding token is required to start onboarding');
        }
        const userAgent = (req.headers['user-agent'] || '').toString().toLowerCase();
        const userType = this.detectUserType(userAgent, req.headers);
        return {
            success: true,
            userType,
            sessionId: `onb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
            inviteOnly,
            access: {
                inviteValidated,
                inviteSource,
                tokenValidated,
            },
        };
    }
    detectUserType(userAgent, headers) {
        const xAgentId = String(headers['x-agent-id'] || '').trim();
        const xAgentType = String(headers['x-agent-type'] || '').trim();
        if (xAgentId || xAgentType) {
            return 'ai_agent';
        }
        const aiHints = ['bot', 'agent', 'claude', 'gpt', 'gemini', 'goose', 'anthropic', 'openai'];
        const looksLikeAgent = aiHints.some((hint) => userAgent.includes(hint));
        return looksLikeAgent ? 'ai_agent' : 'human';
    }
    validateOnboardingToken(token) {
        if (!token)
            return false;
        const normalized = token.trim();
        if (!normalized)
            return false;
        const allowed = (this.configService.get('AUTH_ONBOARDING_TOKENS') ||
            this.configService.get('AUTH_INVITE_CODES') ||
            '')
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean);
        return allowed.includes(normalized);
    }
    pickFirst(...values) {
        for (const value of values) {
            const normalized = String(value || '').trim();
            if (normalized)
                return normalized;
        }
        return undefined;
    }
    headerValue(req, key) {
        const value = req.headers[key];
        if (Array.isArray(value))
            return value[0];
        return typeof value === 'string' ? value : undefined;
    }
    queryValue(req, key) {
        const value = req.query[key];
        if (Array.isArray(value))
            return String(value[0] || '');
        return value ? String(value) : undefined;
    }
};
exports.OnboardingController = OnboardingController;
__decorate([
    (0, common_1.Post)('start'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OnboardingController.prototype, "start", null);
exports.OnboardingController = OnboardingController = __decorate([
    (0, common_1.Controller)('onboarding'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.PUBLIC),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService])
], OnboardingController);
//# sourceMappingURL=onboarding.controller.js.map