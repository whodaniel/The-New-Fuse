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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeuralController = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@the-new-fuse/core");
const auth_guard_1 = require("../guards/auth.guard");
let NeuralController = class NeuralController {
    agentService;
    memorySystem;
    promptService;
    constructor(agentService, memorySystem, promptService) {
        this.agentService = agentService;
        this.memorySystem = memorySystem;
        this.promptService = promptService;
    }
    async searchMemories(query) {
        try {
            const results = await this.memorySystem.search(query);
            return {
                success: true,
                data: results,
            };
        }
        catch (error) { // Explicitly type error as unknown
            return {
                success: false,
                // Check if error is an instance of Error before accessing message
                error: error instanceof Error ? error.message : 'An unknown error occurred',
            };
        }
    }
    async addMemory(content) {
        try {
            await this.memorySystem.add(content);
            return {
                success: true,
                message: 'Memory stored successfully',
            };
        }
        catch (error) { // Explicitly type error as unknown
            return {
                success: false,
                // Check if error is an instance of Error before accessing message
                error: error instanceof Error ? error.message : 'An unknown error occurred',
            };
        }
    }
    async addMemoryBatch(body) {
        try {
            for (const content of body.memories) {
                await this.memorySystem.add(content);
            }
            return { success: true };
        }
        catch (error) { // Explicitly type error as unknown
            return {
                success: false,
                // Check if error is an instance of Error before accessing message
                error: error instanceof Error ? error.message : 'An unknown error occurred',
            };
        }
    }
    async renderPrompt(data) {
        try {
            let renderedPrompt;
            if (data.agentId) {
                // For agent-specific templates
                renderedPrompt = await this.promptService.createAgentTemplate({
                    agentId: data.agentId,
                    name: `Agent Template ${data.templateId}`,
                    description: 'Dynamically created agent template',
                    template: data.templateId,
                    parameters: Object.keys(data.variables).map(key => ({
                        name: key,
                        type: 'string',
                        required: true
                    })),
                    purpose: 'user',
                    category: 'agent_prompts',
                    version: 1,
                    metrics: {
                        successRate: 0,
                        averageResponseTime: 0,
                        errorRate: 0,
                        tokenUsage: {
                            average: 0,
                            total: 0
                        },
                        lastUsed: undefined
                    },
                    metadata: {
                        author: 'system',
                        created: new Date(),
                        updated: new Date(),
                        tags: ['agent', 'dynamic']
                    },
                    contextRequirements: {
                        needsHistory: true,
                        needsMemory: true,
                        needsTools: true,
                        needsState: true
                    },
                    expectedResponse: {
                        format: 'text'
                    }
                });
            }
            else {
                // For regular templates
                renderedPrompt = await this.promptService.renderTemplate(data.templateId, data.variables);
            }
            return {
                success: true,
                data: renderedPrompt,
            };
        }
        catch (error) { // Explicitly type error as unknown
            return {
                success: false,
                // Check if error is an instance of Error before accessing message
                error: error instanceof Error ? error.message : 'An unknown error occurred',
            };
        }
    }
};
exports.NeuralController = NeuralController;
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NeuralController.prototype, "searchMemories", null);
__decorate([
    (0, common_1.Post)('memory'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NeuralController.prototype, "addMemory", null);
__decorate([
    (0, common_1.Post)('memory/batch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NeuralController.prototype, "addMemoryBatch", null);
__decorate([
    (0, common_1.Post)('prompt'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NeuralController.prototype, "renderPrompt", null);
exports.NeuralController = NeuralController = __decorate([
    (0, common_1.Controller)('neural'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [core_1.AgentLLMService,
        core_1.MemorySystem,
        core_1.PromptService])
], NeuralController);
