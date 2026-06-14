var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OpenCodeApiProvider_1;
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { LLMProvider } from '../LLMProvider.js';
import { assertDevLoopBudget } from '../../utils/dev-loop-guard.js';
import { loadRootEnv } from '../../utils/root-env.js';
/**
 * OpenCode API Provider
 *
 * Uses the OpenCode server HTTP API to generate completions.
 * Requires OpenCode server to be running (opencode serve).
 *
 * Supported models:
 * - anthropic/claude-sonnet-4-5
 * - anthropic/claude-haiku-4-5
 * - openai/gpt-4
 * - And many more via OpenCode's provider system
 *
 * Features:
 * - Full IDE integration (LSP, formatters)
 * - File editing capabilities
 * - Multi-session support
 * - Tool execution
 * - Provider management
 */
let OpenCodeApiProvider = OpenCodeApiProvider_1 = class OpenCodeApiProvider extends LLMProvider {
    constructor(config) {
        super();
        this.config = config;
        this.logger = new Logger(OpenCodeApiProvider_1.name);
        this.sessionId = null;
        loadRootEnv();
        const baseURL = this.config.baseURL || 'http://localhost:4096';
        this.client = axios.create({
            baseURL,
            timeout: this.config.timeout || 600000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (this.config.serverPassword) {
            this.client.defaults.auth = {
                username: 'opencode',
                password: this.config.serverPassword,
            };
        }
    }
    /**
     * Check if the OpenCode server is available
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/global/health');
            return response.data?.healthy === true;
        }
        catch (error) {
            this.logger.error('OpenCode server health check failed', error);
            return false;
        }
    }
    /**
     * Initialize a new session with OpenCode
     */
    async createSession() {
        try {
            const response = await this.client.post('/session', {
                title: 'The New Fuse Session',
            });
            this.sessionId = response.data.id;
            return this.sessionId;
        }
        catch (error) {
            this.logger.error('Failed to create OpenCode session', error);
            throw error;
        }
    }
    /**
     * Get or create a session
     */
    async getSession() {
        if (!this.sessionId) {
            return this.createSession();
        }
        return this.sessionId;
    }
    /**
     * Generate completion from prompt using OpenCode API
     */
    async generate(prompt) {
        assertDevLoopBudget('core.opencode.generate', { prompt });
        try {
            const sessionId = await this.getSession();
            const model = this.config.modelName || 'anthropic/claude-sonnet-4-5';
            const messages = [
                {
                    role: 'user',
                    content: prompt,
                },
            ];
            const response = await this.client.post(`/session/${sessionId}/message`, {
                parts: messages,
                model,
            });
            return this.parseResponse(response.data);
        }
        catch (error) {
            this.logger.error('Failed to generate completion from OpenCode API', error);
            throw error;
        }
    }
    /**
     * Chat completion with message history
     */
    async chat(messages, config) {
        const mergedConfig = { ...this.config, ...config };
        assertDevLoopBudget('core.opencode.chat', config);
        try {
            const sessionId = await this.getSession();
            const opencodeMessages = messages.map((msg) => ({
                role: msg.role === 'system' ? 'system' : msg.role,
                content: msg.content,
            }));
            const response = await this.client.post(`/session/${sessionId}/message`, {
                parts: opencodeMessages,
                model: mergedConfig.modelName,
            });
            const content = this.parseResponse(response.data);
            const promptText = messages.map((m) => m.content).join(' ');
            return {
                content,
                usage: {
                    promptTokens: this.estimateTokens(promptText),
                    completionTokens: this.estimateTokens(content),
                    totalTokens: this.estimateTokens(promptText) + this.estimateTokens(content),
                },
                metadata: {
                    provider: 'opencode-api',
                    model: mergedConfig.modelName,
                    sessionId,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to chat with OpenCode API', error);
            throw error;
        }
    }
    /**
     * Parse the response from OpenCode API
     */
    parseResponse(response) {
        const textParts = response.parts
            .filter((part) => part.type === 'text' && part.text)
            .map((part) => part.text);
        return textParts.join('\n');
    }
    /**
     * Estimate token count (rough approximation)
     */
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
    /**
     * Abort the current running operation
     */
    async abort() {
        if (this.sessionId) {
            try {
                await this.client.post(`/session/${this.sessionId}/abort`);
            }
            catch (error) {
                this.logger.warn('Failed to abort OpenCode session', error);
            }
        }
    }
    /**
     * Dispose the session
     */
    async dispose() {
        if (this.sessionId) {
            try {
                await this.client.delete(`/session/${this.sessionId}`);
            }
            catch (error) {
                this.logger.warn('Failed to dispose OpenCode session', error);
            }
            this.sessionId = null;
        }
    }
};
OpenCodeApiProvider = OpenCodeApiProvider_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Object])
], OpenCodeApiProvider);
export { OpenCodeApiProvider };
//# sourceMappingURL=OpenCodeApiProvider.js.map