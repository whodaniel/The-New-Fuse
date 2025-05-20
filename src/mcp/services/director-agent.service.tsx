import { Injectable, Logger } from '@nestjs/common';
import { MCPBrokerService, MCPMessage } from './mcp-broker.service.js';
import { z } from 'zod';

/**
 * Task interface for Director Agent
 */
export interface DirectorTask {
  id: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  description: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Director Agent Service
 * 
 * Main agent that coordinates all MCP operations and sub-agents.
 * Acts as the central orchestrator for all AI tasks.
 */
@Injectable()
export class DirectorAgentService {
  private readonly logger = new Logger(DirectorAgentService.name);
  private readonly tasks = new Map<string, DirectorTask>();
  private readonly agents = new Set<string>();
  
  constructor(private readonly mcpBroker: MCPBrokerService) {
    // Register message handlers
    this.mcpBroker.registerHandler('command', this.handleCommand.bind(this));
    this.mcpBroker.registerHandler('response', this.handleResponse.bind(this));
    this.mcpBroker.registerHandler('error', this.handleError.bind(this));
  }

  /**
   * Handle command message
   */
  private async handleCommand(message: MCPMessage): Promise<void> {
    this.logger.debug(`Director received command: ${JSON.stringify(message)}`);
    
    // Create task from command
    const task: DirectorTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: message.payload.action,
      status: 'pending',
      priority: message.metadata?.priority || 'medium',
      description: `Execute ${message.payload.action} on ${message.payload.server}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        ...message.metadata,
        originalMessageId: message.id,
        sender: message.sender
      }
    };
    
    // Store task
    this.tasks.set(task.id, task);
    
    // Process task
    await this.processTask(task);
  }

  /**
   * Handle response message
   */
  private async handleResponse(message: MCPMessage): Promise<void> {
    this.logger.debug(`Director received response: ${JSON.stringify(message)}`);
    
    // Find original task
    const originalMessageId = message.metadata?.correlationId;
    if (!originalMessageId) {
      this.logger.warn('Response message missing correlationId');
      return;
    }
    
    // Find task by original message ID
    const task = Array.from(this.tasks.values()).find(
      t => t.metadata?.originalMessageId === originalMessageId
    );
    
    if (!task) {
      this.logger.warn(`No task found for message ID: ${originalMessageId}`);
      return;
    }
    
    // Update task
    task.status = 'completed';
    task.result = message.payload.result;
    task.completedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();
    
    // Store updated task
    this.tasks.set(task.id, task);
    
    // Notify completion
    this.logger.log(`Task ${task.id} completed`);
  }

  /**
   * Handle error message
   */
  private async handleError(message: MCPMessage): Promise<void> {
    this.logger.debug(`Director received error: ${JSON.stringify(message)}`);
    
    // Find original task
    const originalMessageId = message.metadata?.correlationId;
    if (!originalMessageId) {
      this.logger.warn('Error message missing correlationId');
      return;
    }
    
    // Find task by original message ID
    const task = Array.from(this.tasks.values()).find(
      t => t.metadata?.originalMessageId === originalMessageId
    );
    
    if (!task) {
      this.logger.warn(`No task found for message ID: ${originalMessageId}`);
      return;
    }
    
    // Update task
    task.status = 'failed';
    task.error = message.payload.error;
    task.updatedAt = new Date().toISOString();
    
    // Store updated task
    this.tasks.set(task.id, task);
    
    // Notify failure
    this.logger.error(`Task ${task.id} failed: ${task.error}`);
  }

  /**
   * Process task
   */
  private async processTask(task: DirectorTask): Promise<void> {
    try {
      // Update task status
      task.status = 'in_progress';
      task.updatedAt = new Date().toISOString();
      this.tasks.set(task.id, task);
      
      // Get original message details
      const originalMessageId = task.metadata?.originalMessageId;
      const sender = task.metadata?.sender;
      
      if (!originalMessageId) {
        throw new Error('Task missing originalMessageId');
      }
      
      // Determine which agent should handle this task
      const assignedAgent = await this.assignTaskToAgent(task);
      if (assignedAgent) {
        task.assignedTo = assignedAgent;
        this.tasks.set(task.id, task);
        
        // Forward task to assigned agent
        // Implementation depends on how agents are integrated
        this.logger.log(`Task ${task.id} assigned to ${assignedAgent}`);
      } else {
        // Handle directly through MCP Broker
        const [serverName, action] = task.type.split('.');
        const params = task.metadata?.params || {};
        
        await this.mcpBroker.executeDirective(serverName, action, params, {
          sender: 'director',
          recipient: sender,
          metadata: {
            taskId: task.id,
            originalMessageId
          }
        });
      }
    } catch (error) {
      // Update task on error
      task.status = 'failed';
      task.error = error.message;
      task.updatedAt = new Date().toISOString();
      this.tasks.set(task.id, task);
      
      this.logger.error(`Failed to process task ${task.id}: ${error.message}`);
    }
  }

  /**
   * Assign task to appropriate agent
   */
  private async assignTaskToAgent(task: DirectorTask): Promise<string | null> {
    // This is a simplified implementation
    // In a real system, you would have logic to determine the best agent
    // based on capabilities, load, etc.
    
    // For now, return null to indicate the Director should handle it directly
    return null;
  }

  /**
   * Register a new agent
   */
  registerAgent(agentId: string, capabilities: string[]): void {
    this.agents.add(agentId);
    this.logger.log(`Agent ${agentId} registered with capabilities: ${capabilities.join(', ')}`);
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.logger.log(`Agent ${agentId} unregistered`);
  }

  /**
   * Get all tasks
   */
  getTasks(filter?: { status?: string; assignedTo?: string }): DirectorTask[] {
    let tasks = Array.from(this.tasks.values());
    
    if (filter?.status) {
      tasks = tasks.filter(t => t.status === filter.status);
    }
    
    if (filter?.assignedTo) {
      tasks = tasks.filter(t => t.assignedTo === filter.assignedTo);
    }
    
    return tasks;
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): DirectorTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Create a new task
   */
  async createTask(
    type: string,
    description: string,
    params: Record<string, any> = {},
    options: {
      priority?: 'low' | 'medium' | 'high';
      metadata?: Record<string, any>;
    } = {}
  ): Promise<DirectorTask> {
    const { priority = 'medium', metadata = {} } = options;
    
    // Create task
    const task: DirectorTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      status: 'pending',
      priority,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        ...metadata,
        params
      }
    };
    
    // Store task
    this.tasks.set(task.id, task);
    
    // Process task
    await this.processTask(task);
    
    return task;
  }
}
