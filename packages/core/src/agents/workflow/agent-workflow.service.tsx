import { AgentWorkflow, WorkflowTask, WorkflowState } from '../types.js';
import { AgentBridgeService } from '../AgentCommunicationBridge.js';
import { TaskQueueService } from '../../task/TaskQueueService.js';
import { StateManagerService } from '../../services/state/state-manager.service.js';
import { MonitoringService } from '../../monitoring/monitoring.service.js';
import { WorkflowError, WorkflowValidationError, AgentAssignmentError } from '../../errors/workflow.errors.js';
import { Agent, AgentRequirement } from '../types.js';
import { WorkflowGraph } from './workflow-graph.js';
import { MCPAgentServer } from '../../mcp/MCPAgentServer.js';

export class AgentWorkflowService {
  constructor(
    private readonly agentBridge: AgentBridgeService,
    private readonly taskQueue: TaskQueueService,
    private readonly stateManager: StateManagerService,
    private readonly monitor: MonitoringService,
    private readonly mcpAgentServer: MCPAgentServer,
    private readonly agentRegistry: unknown
  ) {}

  async initiateWorkflow(workflow: AgentWorkflow): Promise<void> {
    const workflowState = await this.stateManager.createWorkflowState(workflow);
    
    try {
      await this.validateWorkflow(workflow);
      
      // Register any APIs defined in the workflow as MCP tools
      if (workflow.apis) {
        for (const [agentId, apiSpec] of Object.entries(workflow.apis)) {
          await this.mcpAgentServer.registerAgentAPI(agentId, apiSpec);
        }
      }
      
      // Create assignments for agents
      const assignments = new Map();
      for (const task of workflow.tasks) {
        for (const requirement of task.configuration.requirements.capabilities) {
          const agent = await this.findSuitableAgent({ 
            capability: requirement,
            minReliability: 0.95 
          });
          
          if (!agent) {
            throw new AgentAssignmentError(
              `No suitable agent found for requirement ${requirement.capability}`
            );
          }
          assignments.set(requirement, agent);
        }
      }
      
      // Create and schedule tasks
      const tasks = this.prepareTasks(workflow);
      await this.scheduleTasks(tasks, workflowState);

    } catch (error) {
      await this.monitor.recordWorkflowError(workflow.id, error);
      throw error;
    }
  }
  
  private async handleWorkflowError(error: unknown, workflow: AgentWorkflow, state: WorkflowState): Promise<void> {
    // Log and handle workflow errors
    await this.monitor.recordError({
      workflowId: workflow.id,
      error: error.message,
      timestamp: new Date()
    });
  }
  
  private async validateWorkflow(workflow: AgentWorkflow): Promise<any> {
    // Validate workflow structure and configuration
    // This would typically call a validator service
    return {};
  }
  
  private async findSuitableAgent(requirement: AgentRequirement): Promise<Agent | null> {
    const candidates = await this.agentRegistry.findAgents({
      capabilities: requirement.capability,
      status: 'available',
      minReliability: requirement.minReliability || 0.95
    });
    
    return candidates.length > 0 ? candidates[0] : null;
  }
  
  private prepareTasks(workflow: AgentWorkflow): WorkflowTask[] {
    const tasks: WorkflowTask[] = [];
    const graph = new WorkflowGraph(workflow.tasks);

    for (const node of graph.getTopologicalSort()) {
      tasks.push({
        id: crypto.randomUUID(),
        workflowId: workflow.id,
        step: node,
        dependencies: graph.getDependencies(node),
        status: 'pending',
        priority: this.calculateTaskPriority(node, workflow),
        type: node.type,
        name: node.name,
        description: node.description,
        configuration: node.configuration,
        timeout: node.timeout,
        retryPolicy: node.retryPolicy
      });
    }

    return tasks;
  }

  private async scheduleTasks(
    tasks: WorkflowTask[],
    state: WorkflowState
  ): Promise<void> {
    const batches = this.createTaskBatches(tasks);
    
    for(const batch of batches) {
      await Promise.all(
        batch.map(task => this.taskQueue.enqueue(task))
      );
      
      await this.monitor.recordTaskBatch({
        workflowId: state.workflow.id,
        batchSize: batch.length,
        timestamp: new Date()
      });
    }
  }
  
  private createTaskBatches(tasks: WorkflowTask[]): WorkflowTask[][] {
    const batches: WorkflowTask[][] = [];
    const remainingTasks = new Set(tasks);
    
    while(remainingTasks.size > 0) {
      const availableTasks = Array.from(remainingTasks)
        .filter(task => this.canExecuteTask(task, remainingTasks));
      
      if(availableTasks.length === 0) {
        throw new WorkflowError('Circular dependency detected');
      }
      
      batches.push(availableTasks);
      availableTasks.forEach(task => remainingTasks.delete(task));
    }
    
    return batches;
  }

  private canExecuteTask(
    task: WorkflowTask,
    remainingTasks: Set<WorkflowTask>
  ): boolean {
    return task.dependencies.every(depId => 
      !Array.from(remainingTasks).some(t => t.id === depId)
    );
  }
  
  private calculateTaskPriority(node: unknown, workflow: AgentWorkflow): number {
    // Calculate task priority based on dependencies and workflow metadata
    return 1;
  }
}