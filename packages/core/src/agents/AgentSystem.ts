import { Injectable, Logger } from '@nestjs/common';
import { Agent, AgentState, ExtendedAgentConfig } from '../types/agent';
import * as Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { AgentManager } from './AgentManager';
import { AgentProcessor } from '../agent/AgentProcessor';

@Injectable()
export class AgentSystem {
  private readonly logger = new Logger(AgentSystem.name);
  private readonly redis: Redis.Redis;
  private initialized = false;
  private readonly agentManager: AgentManager;
  private readonly agentProcessor: AgentProcessor;

  constructor(agentManager: AgentManager, agentProcessor: AgentProcessor) {
    this.agentManager = agentManager;
    this.agentProcessor = agentProcessor;
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.redis.ping();
      this.initialized = true;
      this.logger.log('Agent system initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize agent system', { error });
      throw error;
    }
  }

  async createAgent(config: ExtendedAgentConfig): Promise<Agent> {
    try {
      if (!this.initialized) {
        throw new Error('Agent system not initialized');
      }

      const agent = await this.agentManager.createAgent(config);
      // Store in Redis for persistence
      await this.redis.hset(`agent:${config.id}`, {
        config: JSON.stringify(config),
        state: JSON.stringify(agent.state),
        created: new Date().toISOString()
      });
      this.logger.log('Agent created and stored', { agentId: config.id });
      return agent;
    } catch (error) {
      this.logger.error('Failed to create agent', { error, config });
      throw error;
    }
  }

  async getAgent(agentId: string): Promise<Agent | null> {
    try {
      const agent = await this.agentManager.getAgent(agentId);
      if (agent) {
        return agent;
      }

      // Try to load from Redis
      const redisData = await this.redis.hgetall(`agent:${agentId}`);
      if (redisData && redisData.config) {
        const config = JSON.parse(redisData.config);
        const restoredAgent = await this.agentManager.createAgent(config);
        return restoredAgent;
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to get agent', { error, agentId });
      return null;
    }
  }

  async deleteAgent(agentId: string): Promise<boolean> {
    try {
      const deleted = await this.agentManager.deleteAgent(agentId);
      if (deleted) {
        await this.redis.del(`agent:${agentId}`);
        this.logger.log('Agent deleted', { agentId });
      }
      return deleted;
    } catch (error) {
      this.logger.error('Failed to delete agent', { error, agentId });
      return false;
    }
  }

  async listAgents(): Promise<Agent[]> {
    try {
      return await this.agentManager.getAllAgents();
    } catch (error) {
      this.logger.error('Failed to list agents', { error });
      return [];
    }
  }

  async processAgent(agentId: string): Promise<void> {
    try {
      const agent = await this.getAgent(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      const result = await this.agentProcessor.processAgent(agent);
      this.logger.log('Agent processed', { agentId, result });
    } catch (error) {
      this.logger.error('Failed to process agent', { error, agentId });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      await this.redis.quit();
      this.initialized = false;
      this.logger.log('Agent system shut down successfully');
    } catch (error) {
      this.logger.error('Failed to shutdown agent system', { error });
    }
  }
}