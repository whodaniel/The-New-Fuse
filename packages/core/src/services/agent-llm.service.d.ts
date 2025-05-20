import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { LLMService } from './llm.service.js';
import { PromptService } from './prompt.service.js';
import { Agent } from '../entities/agent.entity.js';
export declare class AgentLLMService {
    private readonly configService;
    private readonly llmService;
    private readonly promptService;
    private agentRepository;
    constructor(configService: ConfigService, llmService: LLMService, promptService: PromptService, agentRepository: Repository<Agent>);
    processAgentMessage(): Promise<void>;
}
