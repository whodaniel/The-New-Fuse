var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentLLMService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/ConfigService';
let AgentLLMService = AgentLLMService_1 = class AgentLLMService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new Logger(AgentLLMService_1.name);
    }
    async processMessage(message) {
        if (!message || message.trim() === '') {
            throw new Error('Message cannot be empty');
        }
        // Placeholder implementation - Replace with actual LLM processing
        return `Processed: ${message}`;
    }
    async getAgentResponse(prompt) {
        if (!prompt || prompt.trim() === '') {
            throw new Error('Prompt cannot be empty');
        }
        // Placeholder implementation - Replace with actual LLM response
        return `Agent response to: ${prompt}`;
    }
};
AgentLLMService = AgentLLMService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], AgentLLMService);
export { AgentLLMService };
