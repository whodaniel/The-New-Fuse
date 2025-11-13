"use strict";
/**
 * Auggie CLI Adapter
 *
 * Protocol adapter for translating between A2A messages and Auggie CLI commands.
 * Enables seamless integration of Augment Code's AI capabilities into the agent ecosystem.
 *
 * @module AuggieCLIAdapter
 * @since 2025-10-06
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuggieCLIAdapter_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuggieCLIAdapter = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_enums_1 = require("../types/prisma-enums");
const a2a_core_1 = require("@the-new-fuse/a2a-core");
let AuggieCLIAdapter = AuggieCLIAdapter_1 = class AuggieCLIAdapter {
    eventEmitter;
    logger = new common_1.Logger(AuggieCLIAdapter_1.name);
    config;
    constructor(eventEmitter, config = {}) {
        this.eventEmitter = eventEmitter;
        this.config = {
            defaultModel: config.defaultModel || 'claude-sonnet-4',
            defaultTemperature: config.defaultTemperature || 0.7,
            enableCodebaseContext: config.enableCodebaseContext ?? true,
            defaultWorkspace: config.defaultWorkspace,
            ...config,
        };
    }
    getSupportedProtocol() {
        return prisma_enums_1.ProtocolType.CUSTOM;
    }
    async translateToAuggie(message) {
        const messageType = message.type || a2a_core_1.A2AMessageType.TASK_ASSIGNMENT;
        switch (messageType) {
            case a2a_core_1.A2AMessageType.TASK_ASSIGNMENT:
                return this.translateTaskAssignment(message);
            case a2a_core_1.A2AMessageType.AI_CODER_TASK_ASSIGNMENT:
                return this.translateCodeAnalysis(message);
            case a2a_core_1.A2AMessageType.REQUEST:
                return this.translateCodeGeneration(message);
            case a2a_core_1.A2AMessageType.DATA_REQUEST:
                return this.translateDebugRequest(message);
            case a2a_core_1.A2AMessageType.STATUS_UPDATE:
                return this.translateRefactorRequest(message);
            case a2a_core_1.A2AMessageType.RESPONSE:
                return this.translateDocumentationRequest(message);
            case a2a_core_1.A2AMessageType.ERROR_NOTIFICATION:
                return this.translateTestGeneration(message);
            default:
                return this.translateGenericTask(message);
        }
    }
    async executeAndTranslate(message) {
        try {
            const auggieTask = await this.translateToAuggie(message);
            const auggieResponse = await this.executeAuggieTask(auggieTask);
            return this.translateToA2A(auggieResponse, message);
        }
        catch (error) {
            this.logger.error('Translation failed:', error);
            return this.createErrorResponse(message, error);
        }
    }
    async executeAuggieTask(task) {
        // Simulate Auggie CLI execution
        return {
            content: `Auggie CLI response for: ${task.prompt}`,
            model: task.model || this.config.defaultModel || 'claude-sonnet-4',
            timestamp: new Date(),
            usage: {
                inputTokens: 100,
                outputTokens: 200,
            },
        };
    }
    async executeCodeAnalysis(task) {
        return {
            content: `Code analysis result: ${task.prompt}`,
            model: task.model || this.config.defaultModel || 'claude-sonnet-4',
            timestamp: new Date(),
        };
    }
    async executeTask(task) {
        return {
            content: `Task execution result: ${task.prompt}`,
            model: task.model || this.config.defaultModel || 'claude-sonnet-4',
            timestamp: new Date(),
        };
    }
    async executeQuery(task) {
        return {
            content: `Query result: ${task.prompt}`,
            model: task.model || this.config.defaultModel || 'claude-sonnet-4',
            timestamp: new Date(),
        };
    }
    translateTaskAssignment(message) {
        const payload = message.payload;
        return {
            prompt: payload.description || payload.task || payload.prompt || 'No description provided',
            taskType: 'task_execution',
            context: {
                workspace: payload.workspace,
                files: payload.files,
                interactive: payload.interactive,
                dryRun: payload.dryRun,
            },
        };
    }
    translateCodeAnalysis(message) {
        const payload = message.payload;
        return {
            prompt: `Analyze the following code: ${payload.code || payload.description || 'No code provided'}`,
            taskType: 'code_analysis',
            context: {
                filePath: payload.filePath,
                analysisType: payload.analysisType || 'review',
                includeCodebase: this.config.enableCodebaseContext,
            },
        };
    }
    translateCodeGeneration(message) {
        const payload = message.payload;
        return {
            prompt: `Generate code for: ${payload.description || payload.requirements || 'No requirements provided'}`,
            taskType: 'code_generation',
            context: {
                language: payload.language,
                framework: payload.framework,
                requirements: payload.requirements,
                constraints: payload.constraints,
            },
        };
    }
    translateDebugRequest(message) {
        const payload = message.payload;
        return {
            prompt: `Debug the following issue: ${payload.error || payload.description || 'No error description provided'}`,
            taskType: 'debug',
            context: {
                code: payload.code,
                stackTrace: payload.stackTrace,
                environment: payload.environment,
            },
        };
    }
    translateRefactorRequest(message) {
        const payload = message.payload;
        return {
            prompt: `Refactor the following code: ${payload.code || payload.description || 'No code provided'}`,
            taskType: 'refactor',
            context: {
                refactorType: payload.refactorType || 'improve',
                targetLanguage: payload.targetLanguage,
                constraints: payload.constraints,
            },
        };
    }
    translateDocumentationRequest(message) {
        const payload = message.payload;
        return {
            prompt: `Generate documentation for: ${payload.code || payload.description || 'No code provided'}`,
            taskType: 'documentation',
            context: {
                documentationType: payload.documentationType || 'api',
                format: payload.format || 'markdown',
                includeExamples: payload.includeExamples || true,
            },
        };
    }
    translateTestGeneration(message) {
        const payload = message.payload;
        return {
            prompt: `Generate tests for: ${payload.code || payload.description || 'No code provided'}`,
            taskType: 'test_generation',
            context: {
                testFramework: payload.testFramework || 'jest',
                coverageTarget: payload.coverageTarget || 80,
                testTypes: payload.testTypes || ['unit'],
            },
        };
    }
    translateGenericTask(message) {
        const payload = message.payload;
        return {
            prompt: payload.description || payload.content || 'Generic task',
            taskType: 'query',
            context: payload,
        };
    }
    translateToA2A(response, originalMessage) {
        return {
            id: `auggie-${Date.now()}`,
            fromAgent: 'auggie-cli-adapter',
            toAgent: originalMessage.fromAgent,
            type: a2a_core_1.A2AMessageType.RESPONSE,
            payload: {
                content: response.content,
                model: response.model,
                usage: response.usage,
                originalMessageId: originalMessage.id,
            },
            priority: a2a_core_1.A2APriority.MEDIUM,
            timestamp: Date.now(),
            conversationId: originalMessage.conversationId,
            requestId: originalMessage.requestId,
        };
    }
    createErrorResponse(originalMessage, error) {
        return {
            id: `error-${Date.now()}`,
            fromAgent: 'auggie-cli-adapter',
            toAgent: originalMessage.fromAgent,
            type: a2a_core_1.A2AMessageType.ERROR_NOTIFICATION,
            payload: {
                error: error.message,
                originalMessageId: originalMessage.id,
                timestamp: new Date().toISOString(),
            },
            priority: a2a_core_1.A2APriority.HIGH,
            timestamp: Date.now(),
            conversationId: originalMessage.conversationId,
            requestId: originalMessage.requestId,
        };
    }
    getCapabilities() {
        return [
            'code_analysis',
            'code_generation',
            'debugging',
            'refactoring',
            'documentation',
            'test_generation',
            'task_execution',
            'query_processing',
        ];
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        this.logger.log('Auggie CLI adapter configuration updated');
    }
};
exports.AuggieCLIAdapter = AuggieCLIAdapter;
exports.AuggieCLIAdapter = AuggieCLIAdapter = AuggieCLIAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof event_emitter_1.EventEmitter2 !== "undefined" && event_emitter_1.EventEmitter2) === "function" ? _a : Object, Object])
], AuggieCLIAdapter);
//# sourceMappingURL=AuggieCLIAdapter.js.map