/**
 * Coordinator Agent Example
 *
 * This agent coordinates tasks between multiple agents using MCP tools.
 * It demonstrates:
 * - Agent discovery
 * - Task creation and assignment
 * - Workflow execution
 * - Agent-to-agent communication
 */

import { Logger } from '@nestjs/common';
import { MCPClient } from '@the-new-fuse/mcp-core/client';

export class CoordinatorAgent {
  private readonly logger = new Logger(CoordinatorAgent.name);
  private client: MCPClient;
  private agentId: string;

  constructor(agentId: string, serverEndpoint: string) {
    this.agentId = agentId;
    this.client = new MCPClient({
      name: `coordinator-${agentId}`,
      version: '1.0.0',
      timeout: 30000,
    });

    // Connect to MCP server
    this.client.connect(serverEndpoint);
  }

  /**
   * Coordinate a multi-agent workflow
   */
  async coordinateWorkflow(workflowName: string, inputs: any): Promise<any> {
    this.logger.log(`Starting workflow coordination: ${workflowName}`);

    try {
      // Step 1: Discover available agents
      const availableAgents = await this.discoverAgents();
      this.logger.log(`Found ${availableAgents.length} available agents`);

      // Step 2: Create workflow
      const workflow = await this.createWorkflow(workflowName, inputs);
      this.logger.log(`Created workflow: ${workflow.workflowId}`);

      // Step 3: Assign tasks to agents based on capabilities
      const tasks = await this.assignTasks(workflow, availableAgents);
      this.logger.log(`Assigned ${tasks.length} tasks`);

      // Step 4: Start collaboration
      const collaboration = await this.startCollaboration(
        availableAgents.map((a: any) => a.id),
        `Execute workflow: ${workflowName}`
      );
      this.logger.log(`Started collaboration: ${collaboration.collaborationId}`);

      // Step 5: Execute workflow
      const execution = await this.executeWorkflow(workflow.workflowId, inputs);
      this.logger.log(`Workflow execution: ${execution.executionId}`);

      // Step 6: Monitor progress
      const result = await this.monitorExecution(execution.executionId);

      return {
        workflowId: workflow.workflowId,
        executionId: execution.executionId,
        collaborationId: collaboration.collaborationId,
        result,
        participatingAgents: availableAgents.length,
      };
    } catch (error) {
      this.logger.error(`Workflow coordination failed:`, error);
      throw error;
    }
  }

  /**
   * Discover available agents
   */
  private async discoverAgents(): Promise<any[]> {
    const response = await this.client.callTool('agent.discover', {
      status: 'active',
    });

    return response.result.agents || [];
  }

  /**
   * Create a workflow
   */
  private async createWorkflow(name: string, inputs: any): Promise<any> {
    const response = await this.client.callTool('workflow.create', {
      name,
      description: `Coordinated workflow: ${name}`,
      definition: {
        inputs,
        steps: [
          { id: 'step1', type: 'data_processing' },
          { id: 'step2', type: 'api_integration' },
          { id: 'step3', type: 'result_aggregation' },
        ],
      },
    });

    return response.result;
  }

  /**
   * Assign tasks to agents
   */
  private async assignTasks(workflow: any, agents: any[]): Promise<any[]> {
    const tasks = [];

    for (const [index, agent] of agents.entries()) {
      const taskResponse = await this.client.callTool('task.create', {
        title: `Task ${index + 1} for ${workflow.workflowId}`,
        description: `Execute step ${index + 1} of the workflow`,
        assignedTo: agent.id,
        priority: 'normal',
        metadata: {
          workflowId: workflow.workflowId,
          step: index + 1,
        },
      });

      tasks.push(taskResponse.result);

      // Notify the agent
      await this.client.callTool('agent.message', {
        targetAgent: agent.id,
        message: `You have been assigned a new task: ${taskResponse.result.taskId}`,
        messageType: 'notification',
        priority: 'normal',
      });
    }

    return tasks;
  }

  /**
   * Start collaboration
   */
  private async startCollaboration(agentIds: string[], purpose: string): Promise<any> {
    const response = await this.client.callTool('communication.broadcast', {
      message: `Starting collaboration: ${purpose}`,
      targets: agentIds,
      priority: 'high',
    });

    return {
      collaborationId: response.result.broadcastId,
      participants: agentIds,
    };
  }

  /**
   * Execute workflow
   */
  private async executeWorkflow(workflowId: string, inputs: any): Promise<any> {
    const response = await this.client.callTool('workflow.execute', {
      workflowId,
      inputs,
      async: false,
    });

    return response.result;
  }

  /**
   * Monitor execution progress
   */
  private async monitorExecution(executionId: string): Promise<any> {
    // Poll for status
    let status = 'running';
    let attempts = 0;
    const maxAttempts = 30;

    while (status === 'running' && attempts < maxAttempts) {
      const response = await this.client.callTool('workflow.status', {
        executionId,
      });

      status = response.result.status;

      if (status === 'completed') {
        return response.result;
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error(`Execution timeout after ${maxAttempts} attempts`);
  }

  /**
   * Get agent status
   */
  async getStatus(): Promise<any> {
    return {
      agentId: this.agentId,
      type: 'coordinator',
      status: 'active',
      capabilities: ['workflow_coordination', 'task_assignment', 'agent_discovery'],
    };
  }

  /**
   * Disconnect from server
   */
  async disconnect(): Promise<void> {
    await this.client.disconnect();
    this.logger.log('Coordinator agent disconnected');
  }
}

/**
 * Example usage
 */
export async function runCoordinatorExample(): Promise<void> {
  const agent = new CoordinatorAgent('coordinator_001', 'ws://localhost:3100');

  try {
    const result = await agent.coordinateWorkflow('Data Processing Pipeline', {
      sourceData: 'https://api.example.com/data',
      transformations: ['normalize', 'aggregate', 'enrich'],
      outputFormat: 'json',
    });

    console.log('Workflow coordination completed:', result);
  } catch (error) {
    console.error('Workflow coordination failed:', error);
  } finally {
    await agent.disconnect();
  }
}
