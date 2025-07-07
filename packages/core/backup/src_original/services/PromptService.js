var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function') r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function') return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
let PromptService = class PromptService {
    constructor() { }
    async generatePrompt(template, variables) {
        if (!template || template.trim() === '') {
            throw new Error('Template cannot be empty');
        }
        let prompt = template;
        for (const [key, value] of Object.entries(variables)) {
            prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));``;
        }
        return prompt;
    }
    async validatePrompt(prompt) {
        if (!prompt || typeof prompt !== 'string') {
            return false;
        }
        return prompt.length > 0 && prompt.length < 10000;
    }
    async createSystemPrompt(context) {
        const systemTemplate = `You are a helpful AI assistant. Context: {{context}}`;``;
        return this.generatePrompt(systemTemplate, { context });
    }
    async createUserPrompt(message) {
        if (!message || message.trim() === '') {
            throw new Error('Message cannot be empty');
        }
        return message.trim();
    }
};
PromptService = __decorate([
    Injectable(),
    __metadata('design:paramtypes', [])
], PromptService);
export { PromptService };
