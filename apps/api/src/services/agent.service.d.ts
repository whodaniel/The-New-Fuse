import { Repository } from 'typeorm';
import { Agent } from '../entities/agent.entity.js';
import { CreateAgentDto, UpdateAgentDto } from '../dtos/agent.dto.js';
import { AgentFactory } from '@the-new-fuse/core';
export declare class AgentService {
    private readonly agentRepository;
    private readonly agentFactory;
    constructor(agentRepository: Repository<Agent>, agentFactory: AgentFactory);
    findAll(): Promise<Agent[]>;
    findOne(id: string): Promise<Agent>;
    create(createAgentDto: CreateAgentDto): Promise<Agent>;
    update(id: string, updateAgentDto: UpdateAgentDto): Promise<Agent>;
    remove(id: string): Promise<void>;
}
