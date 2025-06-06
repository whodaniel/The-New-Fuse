import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import OpenAI from "openai";
import { Agent as AgentEntity } from '../../entities/agent.entity.js';
import { ExtendedAgentConfig, Agent, AgentState, AgentTask, AgentAction, Message } from '../../types/agent.d.js';

export interface AgentResponse {
  result: string;
  visualization?: {
    nodes: Array<{ id: string; label: string; type: string }>;
    edges: Array<{ from: string; to: string; label?: string }>;
  };
}

export interface AgentConfig {
  apiKey: string;
}

@Injectable()
export class AgentService {
  private openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AgentEntity)
    private agentRepository: Repository<AgentEntity>
  ) {
    const apiKey = this.configService.get<string>('openai.apiKey');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey
    });
  }

  public async processPrompt(prompt: string): Promise<AgentResponse> {
    try {
      const completion = await this.openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4'
      });

      const result = completion.choices[0]?.message?.content || '';
      
      return {
        result,
        visualization: this.createVisualization(result)
      };
    } catch (error) {
      console.error('Error processing prompt:', error);
      throw new Error('Failed to process prompt');
    }
  }

  public async createAgent(config: ExtendedAgentConfig): Promise<Agent> {
    await this.agentRepository.save({
      id: config.id,
      name: config.name,
      type: config.type,
      description: config.description,
      config: config,
      status: 'idle',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const state: AgentState = {
      id: `${config.id}-state`,
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
    };

    return {
      config,
      state,
      skills: [],
      memory: [],
      tasks: [],
      actions: []
    };
  }

  public async getAgent(agentId: string): Promise<Agent | null> {
    const agentEntity = await this.agentRepository.findOne({
      where: { id: agentId }
    });

    if (!agentEntity) {
      return null;
    }

    // Convert entity to Agent interface
    return this.entityToAgent(agentEntity);
  }

  public async updateAgentState(agentId: string, updates: Partial<AgentState>): Promise<void> {
    // In a real implementation, you would update the agent state in the database
    // For now, this is a placeholder
    console.log(`Updating agent ${agentId} state:`, updates);
  }

  public async addMessage(agentId: string, message: Message): Promise<void> {
    // In a real implementation, you would add the message to the agent's message history
    console.log(`Adding message for agent ${agentId}:`, message);
  }

  public async createTask(agentId: string, taskData: Partial<AgentTask>): Promise<AgentTask> {
    const task: AgentTask = {
      id: `task-${Date.now()}`,
      agentId,
      type: taskData.type || 'general',
      status: 'pending',
      priority: taskData.priority || 1,
      input: taskData.input,
      startTime: new Date(),
      metadata: taskData.metadata
    };

    // In a real implementation, you would save this to the database
    console.log(`Created task for agent ${agentId}:`, task);
    
    return task;
  }

  public async executeAction(agentId: string, actionData: Partial<AgentAction>): Promise<AgentAction> {
    const action: AgentAction = {
      id: `action-${Date.now()}`,
      agentId,
      type: actionData.type || 'unknown',
      params: actionData.params || {},
      status: 'running',
      startTime: new Date()
    };

    try {
      // Execute the action logic here
      // This is a placeholder implementation
      
      action.status = 'completed';
      action.endTime = new Date();
      action.result = `Action ${action.type} completed successfully`;
    } catch (error) {
      action.status = 'failed';
      action.endTime = new Date();
      action.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // In a real implementation, you would save this to the database
    console.log(`Executed action for agent ${agentId}:`, action);
    
    return action;
  }

  private createVisualization(result: string): {
    nodes: Array<{ id: string; label: string; type: string }>;
    edges: Array<{ from: string; to: string; label?: string }>;
  } {
    // Simple placeholder visualization
    return {
      nodes: [
        { id: 'input', label: 'Input', type: 'input' },
        { id: 'process', label: 'Process', type: 'process' },
        { id: 'output', label: result.substring(0, 20) + '...', type: 'output' }
      ],
      edges: [
        { from: 'input', to: 'process', label: 'processes' },
        { from: 'process', to: 'output', label: 'generates' }
      ]
    };
  }

  private entityToAgent(entity: any): Agent {
    // Convert database entity to Agent interface
    // This is a simplified conversion
    return {
      config: entity.config,
      state: {
        id: `${entity.id}-state`,
        agentId: entity.id,
        status: entity.status || 'idle',
        lastActive: entity.updatedAt || new Date(),
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
  }
}