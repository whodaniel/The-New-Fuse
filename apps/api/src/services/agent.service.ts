import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../entities/agent.entity.js';
import { CreateAgentDto, UpdateAgentDto } from '../dtos/agent.dto.js';
import { AgentFactory } from '@the-new-fuse/core';

@Injectable()
export class AgentService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    private readonly agentFactory: AgentFactory,
  ) {}

  async findAll(): Promise<Agent[]> {
    return this.agentRepository.find();
  }

  async findOne(id: string): Promise<Agent> {
    return this.agentRepository.findOneOrFail({ where: { id } });
  }

  async create(createAgentDto: CreateAgentDto): Promise<Agent> {
    const agent = this.agentRepository.create(createAgentDto);
    await this.agentRepository.save(agent);

    // Initialize agent using factory
    const agentInstance = await this.agentFactory.createAgent(
      createAgentDto.type,
      agent.id,
      createAgentDto.config,
    );

    // Update agent with instance details
    agent.instanceId = agentInstance.id;
    return this.agentRepository.save(agent);
  }

  async update(id: string, updateAgentDto: UpdateAgentDto): Promise<Agent> {
    const agent = await this.findOne(id);
    Object.assign(agent, updateAgentDto);
    
    // Update agent instance if config changed
    if (updateAgentDto.config) {
      await this.agentFactory.updateAgent(agent.instanceId, updateAgentDto.config);
    }

    return this.agentRepository.save(agent);
  }

  async remove(id: string): Promise<void> {
    const agent = await this.findOne(id);
    await this.agentFactory.destroyAgent(agent.instanceId);
    await this.agentRepository.remove(agent);
  }
}
