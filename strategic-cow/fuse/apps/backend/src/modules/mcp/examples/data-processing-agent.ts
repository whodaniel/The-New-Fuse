/**
 * Data Processing Agent Example
 *
 * This agent processes data using MCP tools and collaborates with other agents.
 * It demonstrates:
 * - Resource reading
 * - Task execution
 * - Progress reporting
 * - Result sharing
 */

import { MCPClient } from '@the-new-fuse/mcp-core/client';
import { Logger } from '@nestjs/common';

export class DataProcessingAgent {
  private readonly logger = new Logger(DataProcessingAgent.name);
  private client: MCPClient;
  private agentId: string;
  private currentTask: string | null = null;

  constructor(agentId: string, serverEndpoint: string) {
    this.agentId = agentId;
    this.client = new MCPClient({
      name: `data-processor-${agentId}`,
      version: '1.0.0',
      timeout: 30000,
    });

    this.client.connect(serverEndpoint);
    this.setupMessageHandlers();
  }

  /**
   * Setup message handlers
   */
  private setupMessageHandlers(): void {
    // Listen for task assignments
    this.client.on('notification', async (notification: any) => {
      if (notification.method === 'task.assigned') {
        await this.handleTaskAssignment(notification.params);
      }
    });

    // Listen for messages from other agents
    this.client.on('request', async (request: any) => {
      if (request.method === 'agent.message') {
        await this.handleAgentMessage(request.params);
      }
    });
  }

  /**
   * Handle task assignment
   */
  private async handleTaskAssignment(task: any): Promise<void> {
    this.logger.log(`Task assigned: ${task.taskId}`);
    this.currentTask = task.taskId;

    try {
      // Update task status to in_progress
      await this.updateTaskStatus(task.taskId, 'in_progress', 0);

      // Execute the task
      const result = await this.executeTask(task);

      // Update task status to completed
      await this.updateTaskStatus(task.taskId, 'completed', 100, result);

      this.logger.log(`Task completed: ${task.taskId}`);
      this.currentTask = null;
    } catch (error) {
      this.logger.error(`Task failed: ${task.taskId}`, error);
      await this.updateTaskStatus(
        task.taskId,
        'failed',
        0,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
      this.currentTask = null;
    }
  }

  /**
   * Execute a data processing task
   */
  private async executeTask(task: any): Promise<any> {
    const { taskType, parameters } = task;

    switch (taskType) {
      case 'data_transformation':
        return this.transformData(parameters);
      case 'data_validation':
        return this.validateData(parameters);
      case 'data_aggregation':
        return this.aggregateData(parameters);
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }

  /**
   * Transform data
   */
  private async transformData(params: any): Promise<any> {
    this.logger.log('Transforming data...');

    // Simulate data transformation
    const steps = ['normalize', 'filter', 'enrich', 'format'];
    const results: any[] = [];

    for (const [index, step] of steps.entries()) {
      this.logger.debug(`Processing step: ${step}`);

      // Update progress
      const progress = ((index + 1) / steps.length) * 100;
      await this.updateTaskStatus(this.currentTask!, 'in_progress', progress);

      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 500));

      results.push({ step, status: 'completed', timestamp: new Date() });
    }

    return {
      transformed: true,
      steps: results,
      recordsProcessed: params.recordCount || 100,
    };
  }

  /**
   * Validate data
   */
  private async validateData(params: any): Promise<any> {
    this.logger.log('Validating data...');

    // Simulate validation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      valid: true,
      recordsValidated: params.recordCount || 100,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Aggregate data
   */
  private async aggregateData(params: any): Promise<any> {
    this.logger.log('Aggregating data...');

    // Simulate aggregation
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      aggregated: true,
      groupBy: params.groupBy || 'category',
      totalGroups: 5,
      recordsProcessed: params.recordCount || 100,
    };
  }

  /**
   * Update task status
   */
  private async updateTaskStatus(
    taskId: string,
    status: string,
    progress: number,
    result?: any
  ): Promise<void> {
    await this.client.callTool('task.update', {
      taskId,
      status,
      progress,
      result,
    });
  }

  /**
   * Handle messages from other agents
   */
  private async handleAgentMessage(message: any): Promise<void> {
    this.logger.log(`Message received from ${message.from}: ${message.content}`);

    // Process the message and respond if needed
    if (message.requiresResponse) {
      await this.sendResponse(message.from, {
        status: 'received',
        agentId: this.agentId,
        message: 'Message received and processed',
      });
    }
  }

  /**
   * Send response to another agent
   */
  private async sendResponse(targetAgent: string, content: any): Promise<void> {
    await this.client.callTool('agent.message', {
      targetAgent,
      message: content,
      messageType: 'response',
    });
  }

  /**
   * Request collaboration with another agent
   */
  async collaborateWith(
    targetAgent: string,
    purpose: string,
    data: any
  ): Promise<any> {
    this.logger.log(`Requesting collaboration with ${targetAgent}`);

    const response = await this.client.callTool('agent.message', {
      targetAgent,
      message: {
        purpose,
        data,
        requestType: 'collaboration',
      },
      messageType: 'request',
      requiresResponse: true,
    });

    return response.result;
  }

  /**
   * Share processed data with other agents
   */
  async shareResults(targetAgents: string[], results: any): Promise<void> {
    this.logger.log(`Sharing results with ${targetAgents.length} agents`);

    await this.client.callTool('communication.broadcast', {
      message: {
        type: 'data_processed',
        results,
        source: this.agentId,
      },
      targets: targetAgents,
      priority: 'normal',
    });
  }

  /**
   * Get agent status
   */
  async getStatus(): Promise<any> {
    return {
      agentId: this.agentId,
      type: 'data_processor',
      status: 'active',
      currentTask: this.currentTask,
      capabilities: ['data_transformation', 'data_validation', 'data_aggregation'],
    };
  }

  /**
   * Disconnect from server
   */
  async disconnect(): Promise<void> {
    await this.client.disconnect();
    this.logger.log('Data processing agent disconnected');
  }
}

/**
 * Example usage
 */
export async function runDataProcessingExample(): Promise<void> {
  const agent = new DataProcessingAgent(
    'data_processor_001',
    'ws://localhost:3100'
  );

  try {
    // Simulate receiving a task
    await agent['handleTaskAssignment']({
      taskId: 'task_123',
      taskType: 'data_transformation',
      parameters: {
        recordCount: 1000,
        transformations: ['normalize', 'filter'],
      },
    });

    console.log('Data processing completed');
  } catch (error) {
    console.error('Data processing failed:', error);
  } finally {
    await agent.disconnect();
  }
}
