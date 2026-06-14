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
var OrchestrationController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestrationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const database_1 = require("@the-new-fuse/database");
const auth_policy_1 = require("../auth/auth-policy");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const dev_loop_guard_1 = require("../utils/dev-loop-guard");
let OrchestrationController = OrchestrationController_1 = class OrchestrationController {
    constructor(db) {
        this.db = db;
        this.logger = new common_1.Logger(OrchestrationController_1.name);
    }
    async chat(body, user) {
        (0, dev_loop_guard_1.assertDevLoopBudget)('orchestration.chat', body);
        const message = typeof body?.message === 'string' ? body.message.trim() : '';
        if (!message) {
            throw new common_1.BadRequestException('message is required');
        }
        const context = this.normalizeContext(body?.context);
        await this.assertContextAccess(context, user);
        const resolved = await this.resolveProviderForUser(user, body?.provider, body?.model);
        const response = await this.executeChatCompletion(resolved, message, body?.systemPrompt, body?.temperature, body?.maxTokens);
        return {
            response,
            provider: resolved.provider,
            model: resolved.modelName,
            context: {
                ...context,
                tenantId: user?.tenantId || context.tenantId,
                agencyId: user?.agencyId || context.agencyId,
                userId: user?.id || context.userId,
            },
        };
    }
    normalizeContext(input) {
        if (!input || typeof input !== 'object')
            return {};
        return {
            ...input,
            tenantId: typeof input.tenantId === 'string' ? input.tenantId.trim() : undefined,
            agencyId: typeof input.agencyId === 'string' ? input.agencyId.trim() : undefined,
            workspaceId: typeof input.workspaceId === 'string' ? input.workspaceId.trim() : undefined,
            userId: typeof input.userId === 'string' ? input.userId.trim() : undefined,
        };
    }
    async assertContextAccess(context, user) {
        const privileged = (0, auth_policy_1.isPrivilegedUser)(user || {});
        if (context.userId && user?.id && context.userId !== user.id && !privileged) {
            throw new common_1.ForbiddenException('context.userId mismatch for authenticated user');
        }
        if (context.tenantId && user?.tenantId && context.tenantId !== user.tenantId && !privileged) {
            throw new common_1.ForbiddenException('context.tenantId mismatch for authenticated user');
        }
        if (context.agencyId && user?.agencyId && context.agencyId !== user.agencyId && !privileged) {
            throw new common_1.ForbiddenException('context.agencyId mismatch for authenticated user');
        }
        if (context.workspaceId) {
            const workspace = await this.db.workspaces.findByIdWithOwner(context.workspaceId);
            if (!workspace) {
                throw new common_1.NotFoundException('Workspace not found');
            }
            if (!privileged && workspace.ownerId !== user?.id) {
                const membership = user?.id
                    ? await this.db.workspaceMembers.findMembership(context.workspaceId, user.id)
                    : null;
                if (!membership) {
                    throw new common_1.ForbiddenException('Workspace access denied');
                }
            }
        }
    }
    normalizeProvider(value) {
        return typeof value === 'string' ? value.trim().toLowerCase() : '';
    }
    async resolveProviderForUser(user, requested, requestedModel) {
        const normalizedRequested = this.normalizeProvider(requested);
        const enabledConfigs = await this.safeLoadEnabledConfigs();
        const orderedConfigs = [...enabledConfigs].sort((a, b) => a.priority - b.priority);
        const userProviders = user?.id ? await this.db.providerApiKeys.listByUser(user.id) : [];
        const userProviderSet = new Set(userProviders.map((row) => this.normalizeProvider(row.provider)));
        if (normalizedRequested) {
            return this.resolveSpecificProvider(normalizedRequested, requestedModel, orderedConfigs, userProviderSet, user);
        }
        for (const config of orderedConfigs) {
            const normalized = this.normalizeProvider(config.provider);
            if (!normalized || !userProviderSet.has(normalized))
                continue;
            const userKey = await this.db.providerApiKeys.findDecryptedByUserAndProvider(user.id, normalized);
            if (userKey?.apiKey) {
                return {
                    provider: normalized,
                    modelName: config.modelName,
                    apiKey: userKey.apiKey,
                    apiEndpoint: config.apiEndpoint ?? null,
                };
            }
        }
        if (userProviderSet.size > 0 && user?.id) {
            const provider = [...userProviderSet][0];
            const userKey = await this.db.providerApiKeys.findDecryptedByUserAndProvider(user.id, provider);
            if (userKey?.apiKey) {
                return {
                    provider,
                    modelName: this.defaultModelForProvider(provider),
                    apiKey: userKey.apiKey,
                    apiEndpoint: null,
                };
            }
        }
        if (orderedConfigs.length > 0) {
            const config = orderedConfigs[0];
            if (config.apiKey && config.apiKey.trim()) {
                return {
                    provider: this.normalizeProvider(config.provider),
                    modelName: config.modelName,
                    apiKey: config.apiKey,
                    apiEndpoint: config.apiEndpoint ?? null,
                };
            }
        }
        const openAiEnvKey = process.env.OPENAI_API_KEY?.trim();
        if (openAiEnvKey) {
            return {
                provider: 'openai',
                modelName: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
                apiKey: openAiEnvKey,
                apiEndpoint: process.env.OPENAI_API_BASE?.trim() || null,
            };
        }
        const geminiEnvKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_AI_API_KEY?.trim();
        if (geminiEnvKey) {
            return {
                provider: 'gemini',
                modelName: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
                apiKey: geminiEnvKey,
                apiEndpoint: process.env.GEMINI_API_BASE?.trim() || null,
            };
        }
        throw new common_1.BadRequestException('No LLM provider is configured. Add a provider key in API settings or enable a global provider.');
    }
    async resolveSpecificProvider(provider, requestedModel, orderedConfigs, userProviderSet, user) {
        const config = orderedConfigs.find((entry) => this.normalizeProvider(entry.provider) === provider);
        const modelName = requestedModel?.trim() || config?.modelName || this.defaultModelForProvider(provider);
        if (userProviderSet.has(provider) && user?.id) {
            const userKey = await this.db.providerApiKeys.findDecryptedByUserAndProvider(user.id, provider);
            if (!userKey?.apiKey) {
                throw new common_1.BadRequestException(`No API key configured for provider "${provider}"`);
            }
            return {
                provider,
                modelName,
                apiKey: userKey.apiKey,
                apiEndpoint: config?.apiEndpoint ?? null,
            };
        }
        if (config?.apiKey && config.apiKey.trim()) {
            if (!(0, auth_policy_1.isPrivilegedUser)(user || {})) {
                throw new common_1.ForbiddenException(`Provider "${provider}" requires a personal API key in this workspace`);
            }
            return {
                provider,
                modelName,
                apiKey: config.apiKey,
                apiEndpoint: config.apiEndpoint ?? null,
            };
        }
        throw new common_1.BadRequestException(`Provider "${provider}" is not configured`);
    }
    async safeLoadEnabledConfigs() {
        try {
            return (await this.db.llmConfigs.findEnabled());
        }
        catch (error) {
            this.logger.warn(`LLM config lookup failed: ${error.message}`);
            return [];
        }
    }
    defaultModelForProvider(provider) {
        if (provider === 'anthropic')
            return 'claude-3-5-sonnet-20240620';
        if (provider === 'openrouter')
            return 'openai/gpt-4o-mini';
        if (provider === 'perplexity')
            return 'sonar';
        if (provider === 'groq')
            return 'llama-3.1-70b-versatile';
        return 'gpt-4o-mini';
    }
    resolveChatEndpoint(provider, modelName, apiEndpoint) {
        if (apiEndpoint && apiEndpoint.trim())
            return apiEndpoint.trim();
        if (provider === 'gemini' || provider === 'google') {
            const encodedModel = encodeURIComponent(modelName || 'gemini-2.5-flash');
            return `https://generativelanguage.googleapis.com/v1beta/models/${encodedModel}:generateContent`;
        }
        if (provider === 'anthropic')
            return 'https://api.anthropic.com/v1/messages';
        if (provider === 'openrouter')
            return 'https://openrouter.ai/api/v1/chat/completions';
        if (provider === 'perplexity')
            return 'https://api.perplexity.ai/chat/completions';
        if (provider === 'groq')
            return 'https://api.groq.com/openai/v1/chat/completions';
        return 'https://api.openai.com/v1/chat/completions';
    }
    buildHeaders(provider, apiKey) {
        if (provider === 'gemini' || provider === 'google') {
            return {
                'content-type': 'application/json',
                'x-goog-api-key': apiKey,
            };
        }
        if (provider === 'anthropic') {
            return {
                'content-type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            };
        }
        return {
            'content-type': 'application/json',
            authorization: `Bearer ${apiKey}`,
        };
    }
    buildPayload(provider, modelName, message, systemPrompt, temperature, maxTokens) {
        if (provider === 'gemini' || provider === 'google') {
            const parts = [systemPrompt, message]
                .filter((part) => Boolean(part && part.trim()))
                .map((text) => ({ text }));
            return {
                contents: [{ role: 'user', parts }],
                generationConfig: {
                    maxOutputTokens: maxTokens ?? 800,
                    temperature: typeof temperature === 'number' ? temperature : 0.7,
                },
            };
        }
        if (provider === 'anthropic') {
            return {
                model: modelName,
                max_tokens: maxTokens ?? 800,
                system: systemPrompt,
                messages: [{ role: 'user', content: message }],
            };
        }
        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: message });
        return {
            model: modelName,
            messages,
            temperature: typeof temperature === 'number' ? temperature : 0.7,
            max_tokens: maxTokens ?? 800,
        };
    }
    extractTextContent(provider, payload) {
        if (provider === 'gemini' || provider === 'google') {
            const parts = payload?.candidates?.[0]?.content?.parts;
            if (!Array.isArray(parts))
                return null;
            const text = parts
                .map((part) => part?.text)
                .filter(Boolean)
                .join('');
            return text || null;
        }
        if (provider === 'anthropic') {
            const text = payload?.content?.[0]?.text;
            return typeof text === 'string' ? text : null;
        }
        const message = payload?.choices?.[0]?.message?.content;
        if (typeof message === 'string')
            return message;
        const text = payload?.choices?.[0]?.text;
        return typeof text === 'string' ? text : null;
    }
    async executeChatCompletion(selection, message, systemPrompt, temperature, maxTokens) {
        const provider = selection.provider;
        const endpoint = this.resolveChatEndpoint(provider, selection.modelName, selection.apiEndpoint);
        const headers = this.buildHeaders(provider, selection.apiKey);
        const payload = this.buildPayload(provider, selection.modelName, message, systemPrompt, temperature, maxTokens);
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            const raw = await response.text();
            const parsed = this.tryParseJson(raw);
            if (!response.ok) {
                this.logger.error(`Orchestration chat failed: provider=${provider} status=${response.status} body=${raw.slice(0, 500)}`);
                throw new common_1.BadGatewayException('LLM provider request failed');
            }
            const text = this.extractTextContent(provider, parsed);
            if (!text) {
                throw new common_1.BadGatewayException('Provider returned no response text');
            }
            return text;
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`Orchestration chat transport failed: provider=${provider} error=${error.message}`);
            throw new common_1.BadGatewayException('LLM provider is currently unavailable');
        }
    }
    tryParseJson(payload) {
        try {
            return JSON.parse(payload);
        }
        catch {
            return null;
        }
    }
};
exports.OrchestrationController = OrchestrationController;
__decorate([
    (0, common_1.Post)('chat'),
    (0, swagger_1.ApiOperation)({
        summary: 'Run an AI-assisted chat request with tenant-aware context validation',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'AI response payload' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrchestrationController.prototype, "chat", null);
exports.OrchestrationController = OrchestrationController = OrchestrationController_1 = __decorate([
    (0, swagger_1.ApiTags)('orchestration'),
    (0, common_1.Controller)('orchestration'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard),
    (0, secure_auth_guard_1.JwtAuth)(),
    (0, secure_auth_guard_1.SetRateLimitTier)(secure_auth_guard_1.RateLimitTier.API),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], OrchestrationController);
//# sourceMappingURL=orchestration.controller.js.map