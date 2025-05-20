import { Injectable } from '@nestjs/common';
import { AgentBridgeService } from './AgentCommunicationBridge.js';
import { TaskQueueService } from '../task/TaskQueueService.js';
import { StateManagerService } from './state-manager.service.js';
import { MonitoringService } from '../monitoring/monitoring.service.js';
import { MCPAgentServer } from '../mcp/MCPAgentServer.js';
import { AgentCapabilityDiscoveryService, CapabilityRequirement } from './AgentCapabilityDiscoveryService.js';
import { WorkflowMonitoringService } from './WorkflowMonitoringService.js';
import { Logger } from '../common/logger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { 
  WorkflowError, 
  WorkflowValidationError, 
  AgentAssignmentError 
} from '../errors/workflow.errors.js';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  tasks: WorkflowTask[];
  apis?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface WorkflowTask {
  id: string;
  name: string;
  type: string;
  configuration: {
    requirements: {
      capabilities: string[];
      minReliability?: number;
      preferredAgents?: string[];
    };
    parameters?: Record<string, any>;
  };
  dependencies?: string[];
}

@Injectable()
export class AgentWorkflowService {
  constructor(
    private readonly agentBridge: AgentBridgeService,
    private readonly taskQueue: TaskQueueService,
    private readonly stateManager: StateManagerService,
    private readonly monitor: MonitoringService,
    private readonly mcpAgentServer: MCPAgentServer,
    private readonly capabilityDiscovery: AgentCapabilityDiscoveryService,
    private readonly workflowMonitor: WorkflowMonitoringService,
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  async initiateWorkflow(workflow: Workflow): Promise<void> {
    const workflowState = await this.stateManager.createWorkflowState(workflow);
    
    try {
      // Validate workflow structure and requirements
      await this.validateWorkflow(workflow);
      
      // Register any APIs defined in the workflow as MCP tools
      if (workflow.apis) {
        for (const [agentId, apiSpec] of Object.entries(workflow.apis)) {
          await this.mcpAgentServer.registerAgentAPI(agentId, apiSpec);
        }
      }
      
      // Validate and assign agents to tasks based on capabilities
      const assignments = await this.assignAgentsToTasks(workflow.tasks);
      
      // Create execution plan
      const executionPlan = this.createExecutionPlan(workflow.tasks, assignments);
      
      // Track workflow initiation
      await this.workflowMonitor.trackWorkflowExecution(workflow.id, {
        type: 'WORKFLOW_STARTED',
        metadata: {
          taskCount: workflow.tasks.length,
          assignments: Object.fromEntries(assignments)
        }
      });
      
      // Schedule tasks according to the execution plan
      await this.scheduleTasks(executionPlan, workflowState);
      
      this.logger.info(`Workflow ${workflow.id} initiated successfully`);
    } catch (error) {
      await this.handleWorkflowError(error, workflow, workflowState);
      throw error;
    }
  }

  private async validateWorkflow(workflow: Workflow): Promise<void> {
    // Validate basic workflow structure
    if (!workflow.tasks || workflow.tasks.length === 0) {
      throw new WorkflowValidationError('Workflow must have at least one task');
    }

    // Validate task dependencies
    const taskIds = new Set(workflow.tasks.map(t => t.id));
    for (const task of workflow.tasks) {
      if (task.dependencies) {
        for (const depId of task.dependencies) {
          if (!taskIds.has(depId)) {
            throw new WorkflowValidationError(
              `Task ${task.id} has invalid dependency: ${depId}`
            );
          }
        }
      }
    }

    // Validate capability requirements
    const requirements: CapabilityRequirement[] = workflow.tasks.map(task => ({
      capability: task.configuration.requirements.capabilities[0],
      minReliability: task.configuration.requirements.minReliability,
      preferredAgents: task.configuration.requirements.preferredAgents
    }));

    const validationResult = await this.capabilityDiscovery.validateCapabilityRequirements(
      requirements
    );

    if (!validationResult.valid) {
      throw new WorkflowValidationError(
        'Workflow has invalid capability requirements',
        [
          ...validationResult.missingCapabilities.map(cap => 
            `Missing capability: ${cap}`
          ),
          ...validationResult.unreliableCapabilities.map(cap =>
            `Unreliable capability: ${cap}`
          )
        ]
      );
    }
  }

  private async assignAgentsToTasks(
    tasks: WorkflowTask[]
  ): Promise<Map<string, string>> {
    const assignments = new Map<string, string>();

    for (const task of tasks) {
      const capabilities = await this.capabilityDiscovery.discoverCapabilities({
        capability: task.configuration.requirements.capabilities[0],
        minReliability: task.configuration.requirements.minReliability,
        preferredAgents: task.configuration.requirements.preferredAgents
      });

      if (capabilities.length === 0) {
        throw new AgentAssignmentError(
          `No agents found with required capability: ${task.configuration.requirements.capabilities[0]}`
        );
      }

      // Select the best agent based on ranking
      const bestCapability = capabilities[0];
      const agent = await this.findAgentWithCapability(bestCapability.id);

      if (!agent) {
        throw new AgentAssignmentError(
          `No available agent found for capability: ${bestCapability.name}`
        );
      }

      assignments.set(task.id, agent.id);
    }

    return assignments;
  }

  private async findAgentWithCapability(capabilityId: string): Promise<any> {
    return await this.prisma.agent.findFirst({
      where: {
        capabilities: {
          some: {
            id: capabilityId
          }
        },
        status: 'active'
      }
    });
  }

  private createExecutionPlan(
    tasks: WorkflowTask[],
    assignments: Map<string, string>
  ): WorkflowTask[][] {
    const taskGraph = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();
    
    // Initialize graph and in-degree
    for (const task of tasks) {
      taskGraph.set(task.id, new Set());
      inDegree.set(task.id, 0);
    }

    // Build dependency graph
    for (const task of tasks) {
      if (task.dependencies) {
        for (const depId of task.dependencies) {
          taskGraph.get(depId)?.add(task.id);
          inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
        }
      }
    }

    // Topological sort with level grouping
    const executionPlan: WorkflowTask[][] = [];
    let currentLevel: WorkflowTask[] = [];
    
    // Find all tasks with no dependencies
    const queue = tasks.filter(task => 
      (inDegree.get(task.id) || 0) === 0
    );

    while (queue.length > 0) {
      const levelSize = queue.length;
      currentLevel = [];

      for (let i = 0; i < levelSize; i++) {
        const task = queue.shift()!;
        currentLevel.push(task);

        // Update dependencies
        for (const dependentId of taskGraph.get(task.id) || []) {
          inDegree.set(dependentId, (inDegree.get(dependentId) || 0) - 1);
          if (inDegree.get(dependentId) === 0) {
            queue.push(tasks.find(t => t.id === dependentId)!);
          }
        }
      }

      if (currentLevel.length > 0) {
        executionPlan.push(currentLevel);
      }
    }

    return executionPlan;
  }

  private async scheduleTasks(
    executionPlan: WorkflowTask[][],
    workflowState: any
  ): Promise<void> {
    for (const taskLevel of executionPlan) {
      const levelPromises = taskLevel.map(async task => {
        try {
          await this.taskQueue.enqueue({
            ...task,
            workflowId: workflowState.workflow.id,
            state: workflowState.id,
            timestamp: Date.now()
          });

          await this.workflowMonitor.trackWorkflowExecution(
            workflowState.workflow.id,
            {
              type: 'TASK_SCHEDULED',
              taskId: task.id,
              metadata: {
                configuration: task.configuration
              }
            }
          );
        } catch (error) {
          this.logger.error(`Error scheduling task ${task.id}:`, error);
          throw error;
        }
      });

      await Promise.all(levelPromises);
    }
  }

  private async handleWorkflowError(
    error: Error,
    workflow: Workflow,
    state: any
  ): Promise<void> {
    this.logger.error(`Error in workflow ${workflow.id}:`, error);

    await this.workflowMonitor.trackWorkflowExecution(workflow.id, {
      type: 'WORKFLOW_FAILED',
      error: error.message,
      metadata: {
        errorType: error.constructor.name,
        stack: error.stack
      }
    });

    // Attempt to cleanup and rollback where possible
    try {
      await this.stateManager.markWorkflowFailed(state.id, error);
      await this.taskQueue.cancelWorkflowTasks(workflow.id);
    } catch (cleanupError) {
      this.logger.error(
        `Error during workflow cleanup for ${workflow.id}:`,
        cleanupError
      );
    }
  }
}