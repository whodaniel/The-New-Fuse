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
    configService;
    activeAgents = new Map();
    constructor(configService) {
        this.configService = configService;
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
            default:
                return {
                    maxTokens: 2000,
                    temperature: 0.5,
                    model: 'gpt-3.5-turbo'
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
