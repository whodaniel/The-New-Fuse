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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentFactory = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let AgentFactory = class AgentFactory {
    constructor(configService) {
        this.configService = configService;
        this.activeAgents = new Map();
    }
    async createAgent(type, agentId, config) {
        const instance = {
            id: `${agentId}-instance`,
            type,
            status: 'active',
            config: { ...this.getDefaultConfig(type), ...config }
        };
        this.activeAgents.set(agentId, instance);
        return instance;
    }
    async updateAgent(instanceId, config) {
        const agentId = instanceId.replace('-instance', '');
        const instance = this.activeAgents.get(agentId);
        if (instance) {
            instance.config = { ...instance.config, ...config };
            this.activeAgents.set(agentId, instance);
        }
    }
    async destroyAgent(instanceId) {
        const agentId = instanceId.replace('-instance', '');
        this.activeAgents.delete(agentId);
    }
    getDefaultConfig(type) {
        switch (type) {
            case 'CONVERSATIONAL':
                return {
                    maxTokens: 4000,
                    temperature: 0.7,
                    model: 'gpt-4'
                };
            case 'IDE_EXTENSION':
                return {
                    maxTokens: 2000,
                    temperature: 0.3,
                    model: 'gpt-3.5-turbo'
                };
            case 'API':
                return {
                    maxTokens: 1000,
                    temperature: 0.1,
                    model: 'gpt-3.5-turbo'
                };
            // TNF-specific agent types
            case 'CTO':
                return {
                    maxTokens: 8000,
                    temperature: 0.4,
                    model: 'MiniMax-Text-01',
                    provider: 'minimax',
                    role: 'Chief Technology Officer',
                    expertise: ['architecture', 'feature-parity', 'assimilation', 'moe', 'llm-integration'],
                    sparseAttention: true,
                };
            case 'ORCHESTRATOR':
                return {
                    maxTokens: 4000,
                    temperature: 0.5,
                    model: 'MiniMax-Text-01',
                    provider: 'minimax',
                    role: 'Multi-agent coordinator',
                    heartbeatInterval: 3000,
                };
            case 'SCOUT':
                return {
                    maxTokens: 6000,
                    temperature: 0.6,
                    model: 'MiniMax-Text-01',
                    provider: 'minimax',
                    role: 'AI landscape researcher',
                    expertise: ['market-surveillance', 'trend-detection', 'competitor-analysis'],
                };
            case 'IMPROVER':
                return {
                    maxTokens: 4000,
                    temperature: 0.3,
                    model: 'MiniMax-Text-01',
                    provider: 'minimax',
                    role: 'Continuous improvement engineer',
                    expertise: ['diagnostics', 'self-repair', 'security', 'code-quality'],
                };
            case 'SUB_DIRECTOR':
                return {
                    maxTokens: 8000,
                    temperature: 0.5,
                    model: 'MiniMax-Text-01',
                    provider: 'minimax',
                    role: 'Local hub Sub-Director',
                    platform: 'zo',
                    relayHost: 'localhost',
                    relayPort: 3000,
                    infrastructure: true,
                };
            // Anthropic-powered agents
            case 'CLAUDE_CODE':
                return {
                    maxTokens: 8000,
                    temperature: 0.4,
                    model: 'claude-sonnet-4-5',
                    provider: 'anthropic',
                };
            case 'CLAUDE_OPUS':
                return {
                    maxTokens: 8000,
                    temperature: 0.4,
                    model: 'claude-opus-4-6',
                    provider: 'anthropic',
                };
            // OpenAI-powered agents
            case 'GPT_4':
                return {
                    maxTokens: 4000,
                    temperature: 0.7,
                    model: 'gpt-4',
                    provider: 'openai',
                };
            case 'GPT_4O':
                return {
                    maxTokens: 8000,
                    temperature: 0.7,
                    model: 'gpt-4o',
                    provider: 'openai',
                };
            default:
                return {
                    maxTokens: 2000,
                    temperature: 0.5,
                    model: 'MiniMax-Text-01',
                    provider: 'minimax',
                };
        }
    }
    getActiveAgents() {
        return Array.from(this.activeAgents.values());
    }
    getAgent(agentId) {
        return this.activeAgents.get(agentId);
    }
};
exports.AgentFactory = AgentFactory;
exports.AgentFactory = AgentFactory = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AgentFactory);
//# sourceMappingURL=agent.factory.js.map