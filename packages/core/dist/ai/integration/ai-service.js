var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
let AIService = class AIService {
    constructor() {
        this.models = new Map();
        this.initializeModels();
    }
    initializeModels() {
        // Initialize default models
        this.models.set('gpt-3.5-turbo', {
            name: 'gpt-3.5-turbo',
            provider: 'openai',
            maxTokens: 4096,
            temperature: 0.7
        });
        this.models.set('gpt-4', {
            name: 'gpt-4',
            provider: 'openai',
            maxTokens: 8192,
            temperature: 0.7
        });
        this.models.set('claude-3-sonnet', {
            name: 'claude-3-sonnet',
            provider: 'anthropic',
            maxTokens: 4096,
            temperature: 0.7
        });
        this.models.set('gemini-pro', {
            name: 'gemini-pro',
            provider: 'google',
            maxTokens: 2048,
            temperature: 0.7
        });
    }
    getModel(modelName) {
        return this.models.get(modelName);
    }
    getAllModels() {
        return Array.from(this.models.values());
    }
    getModelsByProvider(provider) {
        return Array.from(this.models.values())
            .filter(model => model.provider === provider);
    }
    async generateResponse(request) {
        const modelConfig = this.getModel(request.model || 'gpt-3.5-turbo');
        if (!modelConfig) {
            throw new Error(`Model ${request.model} not found`);
        }
        // Mock implementation - in real scenario would call actual AI providers
        return {
            content: `Mock response for: ${request.prompt}`,
            usage: {
                promptTokens: Math.floor(request.prompt.length / 4),
                completionTokens: 100,
                totalTokens: Math.floor(request.prompt.length / 4) + 100
            },
            model: modelConfig.name
        };
    }
    async generateStreamResponse(request) {
        const modelConfig = this.getModel(request.model || 'gpt-3.5-turbo');
        if (!modelConfig) {
            throw new Error(`Model ${request.model} not found`);
        }
        // Mock streaming implementation
        async function* mockStream() {
            const words = `Mock streaming response for: ${request.prompt}`.split(' ');
            for (const word of words) {
                yield word + ' ';
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        return mockStream();
    }
    validateRequest(request) {
        const errors = [];
        if (!request.prompt || request.prompt.trim().length === 0) {
            errors.push('Prompt is required and cannot be empty');
        }
        if (request.model && !this.models.has(request.model)) {
            errors.push(`Model ${request.model} is not supported`);
        }
        if (request.maxTokens && request.maxTokens <= 0) {
            errors.push('maxTokens must be greater than 0');
        }
        if (request.temperature && (request.temperature < 0 || request.temperature > 2)) {
            errors.push('temperature must be between 0 and 2');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    addModel(config) {
        if (this.models.has(config.name)) {
            return false;
        }
        this.models.set(config.name, config);
        return true;
    }
    removeModel(modelName) {
        return this.models.delete(modelName);
    }
    updateModel(modelName, updates) {
        const existing = this.models.get(modelName);
        if (!existing) {
            return false;
        }
        const updated = { ...existing, ...updates };
        this.models.set(modelName, updated);
        return true;
    }
    getModelStats() {
        const models = Array.from(this.models.values());
        const providerDistribution = {};
        for (const model of models) {
            providerDistribution[model.provider] = (providerDistribution[model.provider] || 0) + 1;
        }
        const averageMaxTokens = models.reduce((sum, model) => sum + model.maxTokens, 0) / models.length;
        return {
            totalModels: models.length,
            providerDistribution,
            averageMaxTokens: Math.round(averageMaxTokens)
        };
    }
};
AIService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], AIService);
export { AIService };
//# sourceMappingURL=ai-service.js.map