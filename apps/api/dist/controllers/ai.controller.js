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
var AiController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const dev_loop_guard_1 = require("../utils/dev-loop-guard");
let AiController = AiController_1 = class AiController {
    constructor(db) {
        this.db = db;
        this.logger = new common_1.Logger(AiController_1.name);
    }
    async textCompletion(body) {
        (0, dev_loop_guard_1.assertDevLoopBudget)('ai.text-completion', body);
        const { prompt, systemPrompt } = body;
        const provider = await this.getPreferredProvider();
        const providerName = provider.provider.trim().toLowerCase();
        const endpoint = this.resolveTextEndpoint(providerName, provider.modelName, provider.apiEndpoint ?? undefined);
        const headers = this.buildProviderHeaders(providerName, provider.apiKey);
        const payload = this.buildTextPayload(providerName, provider.modelName, prompt, systemPrompt);
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            const raw = await response.text();
            const parsed = this.tryParseJson(raw);
            if (!response.ok) {
                this.logger.error(`AI text completion provider call failed: provider=${providerName} status=${response.status}`);
                throw new common_1.BadGatewayException('Text generation provider request failed');
            }
            const text = this.extractTextContent(providerName, parsed);
            if (!text) {
                throw new common_1.BadGatewayException('Provider returned no text content');
            }
            return {
                text,
                provider: providerName,
                model: provider.modelName,
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`AI text completion transport failed: provider=${providerName} error=${error.message}`);
            throw new common_1.ServiceUnavailableException('Text generation provider is currently unavailable');
        }
    }
    async imageGeneration(body) {
        (0, dev_loop_guard_1.assertDevLoopBudget)('ai.image-generation', body);
        const provider = await this.getPreferredProvider();
        const providerName = provider.provider.trim().toLowerCase();
        if (!this.isOpenAIProvider(providerName)) {
            throw new common_1.ServiceUnavailableException('Image generation requires an OpenAI-compatible provider configured as default.');
        }
        const endpoint = this.resolveImageEndpoint(provider.apiEndpoint ?? undefined);
        const headers = this.buildProviderHeaders(providerName, provider.apiKey);
        const payload = {
            model: this.resolveImageModel(provider.modelName),
            prompt: body.prompt,
            size: '1024x1024',
        };
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            const raw = await response.text();
            const parsed = this.tryParseJson(raw);
            if (!response.ok) {
                this.logger.error(`AI image generation provider call failed: provider=${providerName} status=${response.status}`);
                throw new common_1.BadGatewayException('Image generation provider request failed');
            }
            const imageUrl = parsed?.data?.[0]?.url;
            if (!imageUrl || typeof imageUrl !== 'string') {
                throw new common_1.BadGatewayException('Provider returned no image URL');
            }
            return {
                imageUrl,
                provider: providerName,
                model: payload.model,
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`AI image generation transport failed: provider=${providerName} error=${error.message}`);
            throw new common_1.ServiceUnavailableException('Image generation provider is currently unavailable');
        }
    }
    async getPreferredProvider() {
        let enabled = [];
        try {
            enabled = (await this.db.llmConfigs.findEnabled());
        }
        catch (error) {
            const fallback = this.getEnvFallbackProvider();
            if (fallback) {
                this.logger.warn(`LLM DB config unavailable, using env fallback provider=${fallback.provider}`);
                return fallback;
            }
            this.logger.error(`Unable to load LLM provider config from DB: ${error.message}`);
            throw new common_1.ServiceUnavailableException('LLM provider configuration is unavailable. Check database connectivity and provider setup.');
        }
        if (!enabled.length) {
            const fallback = this.getEnvFallbackProvider();
            if (fallback) {
                return fallback;
            }
            throw new common_1.ServiceUnavailableException('No enabled LLM provider is configured. Configure one in admin settings.');
        }
        const preferred = [...enabled]
            .sort((a, b) => a.priority - b.priority)
            .find((config) => this.isUsableApiKey(config.apiKey));
        if (!preferred) {
            const fallback = this.getEnvFallbackProvider();
            if (fallback) {
                this.logger.warn('Configured LLM providers have no usable API key, using env fallback');
                return fallback;
            }
            throw new common_1.ServiceUnavailableException('Configured LLM providers have no usable API key.');
        }
        return preferred;
    }
    getEnvFallbackProvider() {
        const openaiKey = process.env.OPENAI_API_KEY?.trim();
        if (this.isUsableApiKey(openaiKey)) {
            return {
                provider: 'openai',
                modelName: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
                apiKey: openaiKey,
                apiEndpoint: process.env.OPENAI_API_BASE?.trim() || null,
                priority: 1,
            };
        }
        const geminiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_AI_API_KEY?.trim();
        if (this.isUsableApiKey(geminiKey)) {
            return {
                provider: 'gemini',
                modelName: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
                apiKey: geminiKey,
                apiEndpoint: process.env.GEMINI_API_BASE?.trim() || null,
                priority: 2,
            };
        }
        return null;
    }
    resolveTextEndpoint(provider, model, apiEndpoint) {
        if (provider === 'gemini' || provider === 'google') {
            const encodedModel = encodeURIComponent(model);
            if (apiEndpoint && apiEndpoint.trim()) {
                const trimmed = apiEndpoint.trim();
                if (trimmed.includes('{model}')) {
                    return trimmed.replace('{model}', encodedModel);
                }
                if (trimmed.includes(':generateContent')) {
                    return trimmed;
                }
                return `${trimmed.replace(/\/$/, '')}/v1beta/models/${encodedModel}:generateContent`;
            }
            return `https://generativelanguage.googleapis.com/v1beta/models/${encodedModel}:generateContent`;
        }
        if (apiEndpoint && apiEndpoint.trim()) {
            return apiEndpoint.trim();
        }
        if (provider === 'anthropic') {
            return 'https://api.anthropic.com/v1/messages';
        }
        if (provider === 'openrouter') {
            return 'https://openrouter.ai/api/v1/chat/completions';
        }
        if (provider === 'perplexity') {
            return 'https://api.perplexity.ai/chat/completions';
        }
        if (provider === 'groq') {
            return 'https://api.groq.com/openai/v1/chat/completions';
        }
        return 'https://api.openai.com/v1/chat/completions';
    }
    resolveImageEndpoint(apiEndpoint) {
        if (apiEndpoint && apiEndpoint.trim()) {
            const normalized = apiEndpoint.trim().replace(/\/chat\/completions$/, '');
            const stripped = normalized.replace(/\/responses$/, '');
            return `${stripped}/images/generations`;
        }
        return 'https://api.openai.com/v1/images/generations';
    }
    buildProviderHeaders(provider, apiKey) {
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
    buildTextPayload(provider, model, prompt, systemPrompt) {
        if (provider === 'gemini' || provider === 'google') {
            const parts = [systemPrompt, prompt]
                .filter((part) => Boolean(part && part.trim()))
                .map((text) => ({ text }));
            return {
                contents: [
                    {
                        role: 'user',
                        parts,
                    },
                ],
                generationConfig: {
                    maxOutputTokens: 800,
                },
            };
        }
        if (provider === 'anthropic') {
            return {
                model,
                max_tokens: 800,
                system: systemPrompt || undefined,
                messages: [{ role: 'user', content: prompt }],
            };
        }
        return {
            model,
            messages: [
                ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                { role: 'user', content: prompt },
            ],
        };
    }
    extractTextContent(provider, payload) {
        if (!payload || typeof payload !== 'object') {
            return null;
        }
        if (provider === 'anthropic') {
            const text = payload?.content?.find?.((item) => item?.type === 'text')?.text;
            return typeof text === 'string' ? text : null;
        }
        if (provider === 'gemini' || provider === 'google') {
            const parts = payload?.candidates?.[0]?.content?.parts;
            if (!Array.isArray(parts)) {
                return null;
            }
            const text = parts.map((part) => part?.text).filter(Boolean).join('');
            return text || null;
        }
        const text = payload?.choices?.[0]?.message?.content;
        return typeof text === 'string' ? text : null;
    }
    resolveImageModel(modelName) {
        if (!modelName || modelName.includes('gpt') || modelName.includes('claude')) {
            return 'gpt-image-1';
        }
        return modelName;
    }
    isOpenAIProvider(provider) {
        return provider === 'openai' || provider === 'openai-codex';
    }
    isUsableApiKey(apiKey) {
        const normalized = apiKey?.trim();
        if (!normalized) {
            return false;
        }
        return !this.isPlaceholderApiKey(normalized);
    }
    isPlaceholderApiKey(apiKey) {
        const normalized = apiKey.toLowerCase();
        return [
            'placeholder',
            'changeme',
            'change-me',
            'dummy',
            'example',
            'your-api-key',
            'your_api_key',
            'your-openai',
            'your_openai',
            'sk-your',
            'test-key',
        ].some((token) => normalized.includes(token));
    }
    tryParseJson(text) {
        try {
            return JSON.parse(text);
        }
        catch {
            return null;
        }
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('text-completion'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "textCompletion", null);
__decorate([
    (0, common_1.Post)('image-generation'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "imageGeneration", null);
exports.AiController = AiController = AiController_1 = __decorate([
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], AiController);
//# sourceMappingURL=ai.controller.js.map