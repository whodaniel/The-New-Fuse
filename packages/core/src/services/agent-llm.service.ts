import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LLMService } from './llm.service.js';
import { PromptService } from './prompt.service.js';
import { Agent } from '../entities/agent.entity.tsx';
import { AgentLLMConfig, CompletionConfig } from '../types/llm.types.js';
import { AgentPromptTemplate } from '../types/prompt.types.js';

@Injectable()
export class AgentLLMService {
    constructor(
        private readonly configService: ConfigService,
        private readonly llmService: LLMService,
        private readonly promptService: PromptService,
        @InjectRepository(Agent)
        private agentRepository: Repository<Agent>
    ) {}

    public async processAgentMessage(
        agent: Agent,
        message: string,
        context: {
            history?: Array<{ role: string; content: string }>;
            memory?: unknown[];
            state?: Record<string, unknown>;
            tools?: Array<{ name: string; description: string }>;
        }
    ): Promise<any> {
        try {
            // Get agent's LLM configuration
            const llmConfig = await this.getAgentLLMConfig(agent.id);
            if (!llmConfig) {
                throw new Error(`No LLM configuration found for agent ${agent.id}`);
            }

            // Get prompt templates
            const systemPrompt = await this.promptService.getAgentTemplatesByPurpose(agent.id, system');
            const userPrompt = await this.promptService.getAgentTemplatesByPurpose(agent.id, user');
            const responsePrompt = await this.promptService.getAgentTemplatesByPurpose(agent.id, response');

            if (!systemPrompt.length || !userPrompt.length) {
                throw new Error(`Missing required prompt templates for agent ${agent.id}`);
            }

            // Prepare completion config
            const completionConfig: CompletionConfig = {
                provider: llmConfig.provider,
                model: llmConfig.model,
                ...llmConfig.parameters,
            };

            // Build the complete prompt
            const fullPrompt = await this.buildAgentPrompt(
                systemPrompt[0],
                userPrompt[0],
                responsePrompt[0],
                message,
                context
            );

            // Check rate limits and constraints
            await this.enforceConstraints(agent.id, llmConfig);

            // Get completion from LLM service
            const completion = await this.llmService.complete(fullPrompt, completionConfig);

            // Update metrics
            await this.updateAgentMetrics(agent.id, completion);

            return completion;
        } catch (error) {
            console.error(`Error processing agent message:`, error);
            throw error;
        }
    }

    private async getAgentLLMConfig(agentId: string): Promise<AgentLLMConfig | null> {
        const agent = await this.agentRepository.findOne({
            where: { id: agentId },
            relations: ['config']
        });

        return agent?.config?.llm || null;
    }

    private async buildAgentPrompt(
        systemPrompt: AgentPromptTemplate,
        userPrompt: AgentPromptTemplate,
        responsePrompt: AgentPromptTemplate | undefined,
        message: string,
        context: {
            history?: Array<{ role: string; content: string }>;
            memory?: unknown[];
            state?: Record<string, unknown>;
            tools?: Array<{ name: string; description: string }>;
        }
    ): Promise<string> {
        // Validate context requirements
        this.validateContextRequirements(systemPrompt, context);
        this.validateContextRequirements(userPrompt, context);
        if (responsePrompt) {
            this.validateContextRequirements(responsePrompt, context);
        }

        // Build the complete prompt
        let fullPrompt = ;

        // Add system prompt
        fullPrompt += systemPrompt.render({
            tools: context.tools,
            state: context.state
        });

        // Add conversation history if available
        if (context.history && context.history.length > 0) {
            fullPrompt += '\n\nConversation history:\'n';
            context.history.forEach(msg => {
                fullPrompt += `${msg.role}: ${msg.content}\n`;
            });
        }

        // Add relevant memories if available
        if (context.memory && context.memory.length > 0) {
            fullPrompt += \n\nRelevant memories:\'n';
            context.memory.forEach(memory => {
                fullPrompt += `- ${JSON.stringify(memory)}\n`;
            });
        }

        // Add user message with template
        fullPrompt += \n' + userPrompt.render({
            message,
            history: context.history,
            memory: context.memory,
            state: context.state
        });

        // Add response format if specified
        if (responsePrompt) {
            fullPrompt += \n' + responsePrompt.render({
                format: responsePrompt.expectedResponse?.format,
                schema: responsePrompt.expectedResponse?.schema
            });
        }

        return fullPrompt;
    }

    private validateContextRequirements(
        template: AgentPromptTemplate,
        context: {
            history?: Array<{ role: string; content: string }>;
            memory?: unknown[];
            state?: Record<string, unknown>;
            tools?: Array<{ name: string; description: string }>;
        }
    ): void {
        const requirements = template.contextRequirements;
        if (!requirements) return;

        if (requirements.needsHistory && (!context.history || context.history.length === 0)) {
            throw new Error('Conversation history required but not provided');
        }

        if (requirements.needsMemory && (!context.memory || context.memory.length === 0)) {
            throw new Error('Memory access required but not provided');
        }

        if (requirements.needsTools && (!context.tools || context.tools.length === 0)) {
            throw new Error('Tool access required but not provided');
        }

        if (requirements.needsState && !context.state) {
            throw new Error('State access required but not provided');
        }
    }

    private async enforceConstraints(agentId: string, config: AgentLLMConfig): Promise<void> {
        if (!config.constraints) return;

        // Check rate limits
        if (config.constraints.maxRequestsPerMinute) {
            const recentRequests = await this.getRecentRequestCount(agentId);
            if (recentRequests >= config.constraints.maxRequestsPerMinute) {
                throw new Error('Rate limit exceeded: too many requests per minute');
            }
        }

        // Check token limits - this would be enforced by the LLM service
        if (config.constraints.maxTokensPerRequest) {
            // This would be checked by the LLM service itself
        }

        // Check cost limits
        if (config.constraints.maxCostPerDay) {
            const todayCost = await this.getTodayCost(agentId);
            if (todayCost >= config.constraints.maxCostPerDay) {
                throw new Error('Daily cost limit exceeded');
            }
        }
    }

    private async getRecentRequestCount(_agentId: string): Promise<number> {
        // This would be implemented to fetch recent request count from your metrics storage
        // For now, return 0 as a placeholder
        return 0;
    }

    private async getTodayCost(_agentId: string): Promise<number> {
        // This would be implemented to fetch today's cost from your metrics storage
        // For now, return 0 as a placeholder
        return 0;
    }

    private async updateAgentMetrics(agentId: string, completion: any): Promise<void> {
        // This would be implemented to update metrics in your metrics storage
        // You might track things like:
        // - Number of requests
        // - Token usage
        // - Response times
        // - Success/failure rates
        // - Costs
        
        // Placeholder implementation
        console.log(`Updating metrics for agent ${agentId}:`, {
            tokens: completion.usage?.totalTokens,
            provider: completion.provider,
            model: completion.model
        });
    }
}
