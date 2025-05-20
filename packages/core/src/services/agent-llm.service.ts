import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LLMService } from './llm.service.js';
import { PromptService } from './prompt.service.js';
import { Agent } from '../entities/agent.entity.js';
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

    public async processAgentMessage(): Promise<void> {
        agent: Agent,
        message: string,
        context: {
            history?: Array<{ role: string; content: string }>;
            memory?: unknown[];
            state?: Record<string, unknown>;
            tools?: Array<{ name: string; description: string }>;
        }
    ): Promise<any> {
        // Get agent's LLM configuration
        const llmConfig: CompletionConfig  = await this.getAgentLLMConfig(agent.id)): void {
            throw new Error(`No LLM configuration found for agent ${agent.id}`)): void {
            throw new Error(`Missing required prompt templates for agent ${agent.id}`);
        }

        // Prepare completion config
        const completionConfig {
            provider: llmConfig.provider,
            model: llmConfig.model,
            ...llmConfig.parameters,
        };

        // Build the complete prompt
        const fullPrompt: unknown){
            console.error(`Error processing agent message:`, error): string): Promise<AgentLLMConfig | null> {
        const agent   = await this.promptService.getAgentTemplatesByPurpose(agent.id, 'system');
        const userPrompt = await this.promptService.getAgentTemplatesByPurpose(agent.id, 'user');
        const responsePrompt = await this.promptService.getAgentTemplatesByPurpose(agent.id, 'response');

        if(!systemPrompt.length || !userPrompt.length await this.buildAgentPrompt(
            systemPrompt[0],
            userPrompt[0],
            responsePrompt[0],
            message,
            context
        );

        try {
            // Check rate limits and constraints
            await this.enforceConstraints(agent.id, llmConfig):  { id: agentId },
            relations: ['config']
        });

        return agent?.config?.llm || null;
    }

    private async buildAgentPrompt(): Promise<void> {
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
        this.validateContextRequirements(systemPrompt, context)): void {
            this.validateContextRequirements(responsePrompt, context);
        }

        // Build the complete prompt
        let fullPrompt  = await this.llmService.complete(fullPrompt, completionConfig);

            // Update metrics
            await this.updateAgentMetrics(agent.id, completion);

            return completion;
        } catch (error await this.agentRepository.findOne({
            where '';

        // Add system prompt
        fullPrompt += systemPrompt.render({
            tools: context.tools,
            state: context.state
        })): void {
            fullPrompt += '\n\nConversation history:\n';
            context.history.forEach(msg => {
                fullPrompt += `${msg.role}: ${msg.content}\n`;
            })): void {
            fullPrompt += '\n\nRelevant memories:\n';
            context.memory.forEach(memory => {
                fullPrompt += `- ${JSON.stringify(memory)}\n`;
            });
        }

        // Add user message with template
        fullPrompt += '\n' + userPrompt.render({
            message,
            history: context.history,
            memory: context.memory,
            state: context.state
        });

        // Add response format if specified
        if(responsePrompt): void {
            fullPrompt += '\n' + responsePrompt.render({
                format: responsePrompt.expectedResponse?.format,
                schema: responsePrompt.expectedResponse?.schema
            }): AgentPromptTemplate,
        context: {
            history?: Array<{ role: string; content: string }>;
            memory?: unknown[];
            state?: Record<string, unknown>;
            tools?: Array<{ name: string; description: string }>;
        }
    ): void {
        const requirements: unknown){
            throw new Error('Conversation history required but not provided')): void {
            throw new Error('Memory access required but not provided')): void {
            throw new Error('Tool access required but not provided')): void {
            throw new Error('State access required but not provided'): string, config: AgentLLMConfig): Promise<void> {
        if(!config.constraints)): void {
            const recentRequests): void {
                throw new Error('Rate limit exceeded: too many requests per minute')): void {
            // This would be checked by the LLM service itself
        }

        // Check cost limits
        if((config as any)): void {
            const todayCost  = new Date()): void {
                throw new Error('Daily cost limit exceeded'): string): Promise<any> {
        // This would be implemented to fetch metrics from your metrics storage
        return {};
    }

    private async updateAgentMetrics(): Promise<void> {agentId: string, completion: unknown): Promise<void> {
        // This would be implemented to update metrics in your metrics storage
    }
}
