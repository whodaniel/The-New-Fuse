import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { PromptTemplate } from '../entities/prompt.entity.js';
import { AgentPromptTemplate } from '../entities/agent-prompt.entity.js';
export declare class PromptService {
    private readonly configService;
    private promptRepository;
    private agentPromptRepository;
    renderTemplate(templateId: string, variables: Record<string, unknown>): void;
    private agentTemplates;
    constructor(configService: ConfigService, promptRepository: Repository<PromptTemplate>, agentPromptRepository: Repository<AgentPromptTemplate>);
}
