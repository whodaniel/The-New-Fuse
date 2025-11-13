var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let AgentLLMService = class AgentLLMService {
    defaultModel = 'gpt-3.5-turbo';
    async generateResponse(request) {
        try {
            // Simulate LLM API call
            const response = await this.callLLMAPI(request);
            return response;
        }
        catch (error) {
            throw new Error(`LLM generation failed: ${error.message}`);
        }
    }
    async streamResponse(request) {
        if (!request.stream) {
            throw new Error('Stream mode not enabled in request');
        }
        return this.createStreamResponse(request);
    }
    async callLLMAPI(request) {
        // Mock implementation - replace with actual LLM API call
        const model = request.model || this.defaultModel;
        const content = `Response to: ${request.prompt}`;
        return {
            content,
            model,
            usage: {
                promptTokens: request.prompt.length / 4,
                completionTokens: content.length / 4,
                totalTokens: (request.prompt.length + content.length) / 4
            }
        };
    }
    async *createStreamResponse(request) {
        const words = `Response to: ${request.prompt}`.split(' ');
        for (const word of words) {
            yield word + ' ';
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    async validateModel(model) {
        const supportedModels = [
            'gpt-3.5-turbo',
            'gpt-4',
            'claude-3-sonnet',
            'claude-3-haiku'
        ];
        return supportedModels.includes(model);
    }
    getDefaultModel() {
        return this.defaultModel;
    }
    getSupportedModels() {
        return [
            'gpt-3.5-turbo',
            'gpt-4',
            'claude-3-sonnet',
            'claude-3-haiku'
        ];
    }
};
AgentLLMService = __decorate([
    Injectable()
], AgentLLMService);
export { AgentLLMService };
//# sourceMappingURL=AgentLLMService.js.map