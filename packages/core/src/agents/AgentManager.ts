import { Injectable, Logger } from '@nestjs/common';
import { Agent, AgentState, ExtendedAgentConfig } from '../types/agent.d';
import { AgentProcessor } from '../agent/core/AgentProcessor';
import { AgentCommunicationManager } from './AgentCommunicationManager';

export enum AgentStatus {
  INITIALIZING = 'initializing',
  READY = 'ready',
  BUSY = 'busy',
  ERROR = 'error',
  STOPPED = 'stopped'
}

@Injectable()
export class AgentManager {
  private readonly logger = new Logger(AgentManager.name);
  private readonly agents = new Map<string, Agent>();

  constructor(
    private readonly agentProcessor: AgentProcessor,
    private readonly communicationManager: AgentCommunicationManager
  ) {}

  async createAgent(config: ExtendedAgentConfig): Promise<Agent> {
    try {
      const agent: Agent = {
        config,
        state: {
          id: `state_${config.id}`,
          agentId: config.id,
          status: 'idle',
          lastActive: new Date(),
          metrics: {
            totalTasks: 0,
            successfulTasks: 0,
            failedTasks: 0,
            averageTaskDuration: 0,
            messagesProcessed: 0,
            toolsUsed: 0
          },
          messages: [],
          pendingTasks: [],
          activeTools: []
        },
        skills: [],
        memory: [],
        tasks: [],
        actions: []
      };
      
      this.agents.set(config.id, agent);
      this.logger.log('Agent created successfully', { agentId: config.id });
      return agent;
    } catch (error) {
      this.logger.error('Failed to create agent', { error, config });
      throw error;
    }
  }

  async getAgent(agentId: string): Promise<Agent | undefined> {
    return this.agents.get(agentId);
  }

  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<Agent> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent with id ${agentId} not found`);
    }

    const updatedAgent = { ...agent, ...updates };
    this.agents.set(agentId, updatedAgent);
    this.logger.log('Agent updated', { agentId });
    return updatedAgent;
  }

  async deleteAgent(agentId: string): Promise<boolean> {
    const deleted = this.agents.delete(agentId);
    if (deleted) {
      this.logger.log('Agent deleted', { agentId });
    }
    return deleted;
  }

  async startAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent with id ${agentId} not found`);
    }

    agent.state.status = 'busy';
    agent.state.lastActive = new Date();
    this.logger.log('Agent started', { agentId });
  }

  async stopAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent with id ${agentId} not found`);
    }

    agent.state.status = 'idle';
    agent.state.lastActive = new Date();
    this.logger.log('Agent stopped', { agentId });
  }
}