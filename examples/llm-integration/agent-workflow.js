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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentWorkflowExample = void 0;
import common_1 from '@nestjs/common';
import agent_llm_service_1 from '@the-new-fuse/core/services/agent-llm.service';
import prompt_service_1 from '@the-new-fuse/core/services/prompt.service';
import llm_service_1 from '@the-new-fuse/core/services/llm.service';
let AgentWorkflowExample = class AgentWorkflowExample {
    constructor(agentLLMService, promptService, llmService) {
        this.agentLLMService = agentLLMService;
        this.promptService = promptService;
        this.llmService = llmService;
    }
    async setupAgent(agent) {
        const llmConfig = {
            provider: 'openai',
            model: 'gpt-4',
            systemPrompt: 'You are a helpful AI assistant that specializes in data analysis.',
            parameters: {
                temperature: 0.7,
                maxTokens: 2000,
                topP: 0.9,
                frequencyPenalty: 0.0,
                presencePenalty: 0.0
            },
            constraints: {
                maxRequestsPerMinute: 60,
                maxTokensPerRequest: 4000,
                maxCostPerDay: 10
            },
            capabilities: {
                streaming: true,
                functionCalling: true,
                toolUse: true,
                codeInterpreting: true
            }
        };
        const systemPrompt = await this.promptService.createAgentTemplate({
            agentId: agent.id,
            name: 'Data Analysis System Prompt',
            description: 'System prompt for data analysis agent',
            purpose: 'system',
            template: `You are an AI assistant specialized in data analysis.
Available tools: {{tools}}
Current workspace state: {{state}}
Please analyze data and provide insights based on the user's requests.
Always format code examples properly and explain your reasoning.`,
            parameters: [
                {
                    name: 'tools',
                    type: 'array',
                    description: 'Available analysis tools',
                    required: true
                },
                {
                    name: 'state',
                    type: 'object',
                    description: 'Current workspace state',
                    required: true
                }
            ],
            contextRequirements: {
                needsTools: true,
                needsState: true
            },
            category: 'data-analysis'
        });
        const userPrompt = await this.promptService.createAgentTemplate({
            agentId: agent.id,
            name: 'Data Analysis User Prompt',
            description: 'Template for processing user requests',
            purpose: 'user',
            template: `User Request: {{message}}
Previous Context: {{history}}
Relevant Data: {{memory}}
Current State: {{state}}

Please provide a detailed analysis based on the above information.`,
            parameters: [
                {
                    name: 'message',
                    type: 'string',
                    required: true
                },
                {
                    name: 'history',
                    type: 'array',
                    required: false
                },
                {
                    name: 'memory',
                    type: 'array',
                    required: false
                },
                {
                    name: 'state',
                    type: 'object',
                    required: true
                }
            ],
            contextRequirements: {
                needsHistory: true,
                needsMemory: true,
                needsState: true
            },
            category: 'data-analysis'
        });
        const responsePrompt = await this.promptService.createAgentTemplate({
            agentId: agent.id,
            name: 'Data Analysis Response Format',
            description: 'Template for formatting agent responses',
            purpose: 'response',
            template: `Please format your response according to the following schema:
{{schema}}

Response should be in {{format}} format.`,
            parameters: [
                {
                    name: 'schema',
                    type: 'object',
                    required: true
                },
                {
                    name: 'format',
                    type: 'string',
                    required: true,
                    validation: {
                        enum: ['text', 'json', 'markdown', 'code']
                    }
                }
            ],
            expectedResponse: {
                format: 'markdown',
                schema: {
                    type: 'object',
                    properties: {
                        analysis: { type: 'string' },
                        insights: { type: 'array' },
                        recommendations: { type: 'array' },
                        code: { type: 'string', optional: true }
                    }
                }
            },
            category: 'data-analysis'
        });
        return {
            llmConfig,
            systemPrompt,
            userPrompt,
            responsePrompt
        };
    }
    async runAnalysis(agent, query, dataset, tools) {
        const context = {
            history: [
                { role: 'system', content: 'Analysis session started.' },
                { role: 'user', content: 'I need help analyzing this dataset.' }
            ],
            memory: [
                {
                    type: 'dataset',
                    name: dataset.name,
                    summary: dataset.summary,
                    schema: dataset.schema
                }
            ],
            state: {
                currentDataset: dataset.name,
                activeTools: tools.map(t => t.name),
                analysisPhase: 'initial'
            },
            tools
        };
        try {
            const response = await this.agentLLMService.processAgentMessage(agent, query, context);
            await this.updateAgentMemory(agent, {
                type: 'analysis_result',
                query,
                result: response.text,
                timestamp: new Date()
            });
            return response;
        }
        catch (error) {
            console.error('Analysis failed:', error);
            throw error;
        }
    }
    async updateAgentMemory(agent, memory) {
    }
};
exports.AgentWorkflowExample = AgentWorkflowExample;
exports.AgentWorkflowExample = AgentWorkflowExample = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof agent_llm_service_1.AgentLLMService !== "undefined" && agent_llm_service_1.AgentLLMService) === "function" ? _a : Object, typeof (_b = typeof prompt_service_1.PromptService !== "undefined" && prompt_service_1.PromptService) === "function" ? _b : Object, typeof (_c = typeof llm_service_1.LLMService !== "undefined" && llm_service_1.LLMService) === "function" ? _c : Object])
], AgentWorkflowExample);
//# sourceMappingURL=agent-workflow.js.map