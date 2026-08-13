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
var GoogleADKProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleADKProvider = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const LLMProvider_js_1 = require("../LLMProvider.js");
/**
 * Google ADK Provider
 *
 * Adapter provider that routes TNF LLM calls through the ADK gateway service.
 * The gateway handles ADK runtime integration and returns TNF-normalized envelopes.
 */
let GoogleADKProvider = GoogleADKProvider_1 = class GoogleADKProvider extends LLMProvider_js_1.LLMProvider {
    constructor(config) {
        super();
        this.config = config;
        this.logger = new common_1.Logger(GoogleADKProvider_1.name);
        this.baseURL = (config.baseURL || 'http://localhost:8089').replace(/\/+$/, '');
    }
    async generate(prompt) {
        const response = await this.chat([
            {
                role: 'user',
                content: prompt,
            },
        ]);
        return response.content;
    }
    async chat(messages, config) {
        const mergedConfig = { ...this.config, ...config };
        const payload = {
            requestId: (0, crypto_1.randomUUID)(),
            traceId: (0, crypto_1.randomUUID)(),
            workspaceId: this.config.workspaceId || 'tnf-default-workspace',
            agentId: this.config.agentId || 'tnf-google-adk-provider',
            model: mergedConfig.modelName || 'gemini-2.5-pro',
            input: {
                messages: this.normalizeMessages(messages),
            },
            tools: [],
            metadata: {
                source: 'tnf-google-adk-provider',
                policyProfile: 'default',
            },
            timeoutMs: mergedConfig.timeout || 120000,
        };
        const result = await this.callGateway('/v1/execute', payload, payload.timeoutMs);
        const content = result.output?.content || '';
        const promptText = messages.map((m) => m.content).join('\n');
        return {
            content,
            usage: {
                promptTokens: result.usage?.inputTokens ?? this.estimateTokens(promptText),
                completionTokens: result.usage?.outputTokens ?? this.estimateTokens(content),
                totalTokens: result.usage?.totalTokens ??
                    this.estimateTokens(promptText) + this.estimateTokens(content),
            },
            metadata: {
                requestId: result.requestId,
                traceId: result.traceId,
                status: result.status,
                provider: result.provider || 'google-adk',
                model: result.model || payload.model,
                latencyMs: result.latencyMs,
                gateway: this.baseURL,
                ...result.metadata,
            },
        };
    }
    async *streamChat(messages, config) {
        const mergedConfig = { ...this.config, ...config };
        const payload = {
            requestId: (0, crypto_1.randomUUID)(),
            traceId: (0, crypto_1.randomUUID)(),
            workspaceId: this.config.workspaceId || 'tnf-default-workspace',
            agentId: this.config.agentId || 'tnf-google-adk-provider',
            model: mergedConfig.modelName || 'gemini-2.5-pro',
            input: {
                messages: this.normalizeMessages(messages),
            },
            tools: [],
            metadata: {
                source: 'tnf-google-adk-provider',
                policyProfile: 'default',
            },
            timeoutMs: mergedConfig.timeout || 120000,
        };
        try {
            const response = await this.fetchWithTimeout(`${this.baseURL}/v1/execute/stream`, {
                method: 'POST',
                headers: this.buildHeaders(),
                body: JSON.stringify(payload),
            }, payload.timeoutMs);
            if (!response.ok || !response.body) {
                throw new Error(`ADK stream endpoint failed with status ${response.status}`);
            }
            const decoder = new TextDecoder();
            const reader = response.body.getReader();
            let buffer = '';
            while (true) {
                const { value, done } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (!line.trim())
                        continue;
                    let event;
                    try {
                        event = JSON.parse(line);
                    }
                    catch {
                        // Ignore malformed stream lines to keep stream resilient.
                        continue;
                    }
                    const kind = event.event || event.type;
                    if ((kind === 'chunk' || kind === 'delta') && typeof event.content === 'string') {
                        yield event.content;
                    }
                    if (kind === 'error') {
                        throw new Error(event.error || 'ADK stream error');
                    }
                    if (kind === 'done') {
                        if (event.status === 'error') {
                            throw new Error('ADK stream finished with error status');
                        }
                        return;
                    }
                }
            }
        }
        catch (error) {
            this.logger.warn(`ADK stream unavailable, falling back to non-stream response: ${error.message}`);
            const fallback = await this.chat(messages, config);
            if (fallback.content) {
                yield fallback.content;
            }
        }
    }
    async healthCheck() {
        try {
            const response = await this.fetchWithTimeout(`${this.baseURL}/v1/health`, {
                method: 'GET',
                headers: this.buildHeaders(),
            }, 5000);
            return response.ok;
        }
        catch {
            return false;
        }
    }
    normalizeMessages(messages) {
        return messages.map((message) => ({
            role: message.role === 'assistant' ? 'assistant' : message.role,
            content: message.content,
        }));
    }
    buildHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.config.gatewayApiKey) {
            headers['x-adk-gateway-key'] = this.config.gatewayApiKey;
        }
        return headers;
    }
    async callGateway(path, payload, timeoutMs) {
        const response = await this.fetchWithTimeout(`${this.baseURL}${path}`, {
            method: 'POST',
            headers: this.buildHeaders(),
            body: JSON.stringify(payload),
        }, timeoutMs);
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`ADK gateway error (${response.status}): ${text}`);
        }
        return (await response.json());
    }
    async fetchWithTimeout(url, init, timeoutMs) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(url, {
                ...init,
                signal: controller.signal,
            });
        }
        finally {
            clearTimeout(timeout);
        }
    }
    estimateTokens(text) {
        return Math.max(1, Math.ceil(text.length / 4));
    }
};
exports.GoogleADKProvider = GoogleADKProvider;
exports.GoogleADKProvider = GoogleADKProvider = GoogleADKProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], GoogleADKProvider);
//# sourceMappingURL=GoogleADKProvider.js.map