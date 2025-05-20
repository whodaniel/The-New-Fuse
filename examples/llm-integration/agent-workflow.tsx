import { Injectable } from '@nestjs/common';
import { AgentLLMService } from '@the-new-fuse/core/services/agent-llm.service';
import { PromptService } from '@the-new-fuse/core/services/prompt.service';
import { LLMService } from '@the-new-fuse/core/services/llm.service';
import { Agent } from '@the-new-fuse/core/entities/agent.entity';
import { AgentLLMConfig, CompletionConfig } from '@the-new-fuse/core/types/llm.types';
import { AgentPromptTemplate } from '@the-new-fuse/core/types/prompt.types';

@Injectable()
export class AgentWorkflowExample {
    constructor(
        private readonly agentLLMService: AgentLLMService,
        private readonly promptService: PromptService,
        private readonly llmService: LLMService
    ) {}

    async setupAgent(agent: Agent) {
        // 1. Configure the agent's LLM settings
        const llmConfig: AgentLLMConfig = {
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

        // 2. Create prompt templates for the agent
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

    async runAnalysis(
        agent: Agent,
        query: string,
        dataset: any,
        tools: Array<{ name: string; description: string }>
    ) {
        // 1. Prepare the context
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

        // 2. Process the request through the agent
        try {
            const response = await this.agentLLMService.processAgentMessage(
                agent,
                query,
                context
            );

            // 3. Update agent's memory with the analysis results
            await this.updateAgentMemory(agent, {
                type: 'analysis_result',
                query,
                result: response.text,
                timestamp: new Date()
            });

            return response;
        } catch (error) {
            console.error('Analysis failed:', error);
            throw error;
        }
    }

    private async updateAgentMemory(agent: Agent, memory: any) {
        // Implementation would go here
        // This would use your memory system to store the results
    }
}
