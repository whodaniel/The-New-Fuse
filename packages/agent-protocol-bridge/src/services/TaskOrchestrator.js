"use strict";
/**
 * TaskOrchestrator.ts
 *
 * Task orchestration service for managing complex multi-agent workflows.
 * Handles task queuing, workflow definition, state management, and error recovery.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskOrchestrator = void 0;
const events_1 = require("events");
const ProtobufAdapter_1 = require("../adapters/ProtobufAdapter");
class TaskOrchestrator extends events_1.EventEmitter {
    options;
    workflows = new Map();
    executions = new Map();
    taskQueue = new Map();
    resourceAllocations = new Map();
    protobufAdapter;
    processingInterval;
    isProcessing = false;
    constructor(options = {}) {
        super();
        this.options = options;
        this.protobufAdapter = new ProtobufAdapter_1.ProtobufAdapter();
        this.startProcessing();
    }
    /**
     * Create a new workflow definition
     */
    async createWorkflow(workflow) {
        const workflowDef = {
            id: this.generateId('workflow'),
            ...workflow,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // Validate workflow
        this.validateWorkflow(workflowDef);
        this.workflows.set(workflowDef.id, workflowDef);
        this.emit('workflowCreated', workflowDef);
        return workflowDef;
    }
    /**
     * Validate workflow definition
     */
    validateWorkflow(workflow) {
        if (!workflow.steps || workflow.steps.length === 0) {
            throw new Error('Workflow must have at least one step');
        }
        // Validate step IDs are unique
        const stepIds = workflow.steps.map(s => s.id);
        if (new Set(stepIds).size !== stepIds.length) {
            throw new Error('Workflow step IDs must be unique');
        }
        // Validate dependencies reference valid steps
        if (workflow.dependencies) {
            for (const dep of workflow.dependencies) {
                if (!stepIds.includes(dep.stepId)) {
                    throw new Error(`Dependency references invalid step: ${dep.stepId});
        }
        for (const dependsOn of dep.dependsOn) {
          if (!stepIds.includes(dependsOn)) {`);
                    throw new Error(`Dependency references invalid step: ${dependsOn}`);
                }
            }
        }
    }
}
exports.TaskOrchestrator = TaskOrchestrator;
// Check for circular dependencies
this.checkCircularDependencies(workflow);
checkCircularDependencies(workflow, WorkflowDefinition);
void {
    if(, workflow) { }, : .dependencies, return: ,
    const: visited = new Set(),
    const: recursionStack = new Set(),
    const: hasCycle = (stepId) => {
        if (recursionStack.has(stepId))
            return true;
        if (visited.has(stepId))
            return false;
        visited.add(stepId);
        recursionStack.add(stepId);
        const dependencies = workflow.dependencies?.filter(d => d.stepId === stepId) || [];
        for (const dep of dependencies) {
            for (const dependsOn of dep.dependsOn) {
                if (hasCycle(dependsOn))
                    return true;
            }
        }
        recursionStack.delete(stepId);
        return false;
    },
    for(, step, of, workflow) { }, : .steps
};
{
    if (hasCycle(step.id)) {
        throw new Error(Circular, dependency, detected, involving, step, $, { step, : .id });
    }
}
/**
 * Execute a workflow
 */
async;
executeWorkflow(workflowId, string, context ?  : Record);
Promise < WorkflowExecution > {
    const: workflow = this.workflows.get(workflowId),
    if(, workflow) {
        `
      throw new Error(Workflow not found: ${workflowId}`;
        ;
    },
    const: execution, WorkflowExecution = {
        id: this.generateId('execution'),
        workflowId,
        status: 'pending',
        stepResults: {},
        metadata: context,
    },
    this: .executions.set(execution.id, execution),
    this: .emit('workflowExecutionStarted', execution),
    // Queue initial steps (those with no dependencies)
    await, this: .queueInitialSteps(workflow, execution),
    execution, : .status = 'running',
    execution, : .startedAt = new Date(),
    return: execution
};
async;
queueInitialSteps(workflow, WorkflowDefinition, execution, WorkflowExecution);
Promise < void  > {
    const: dependentSteps = new Set(),
    // Find steps that have dependencies
    if(workflow) { }, : .dependencies
};
{
    for (const dep of workflow.dependencies) {
        dependentSteps.add(dep.stepId);
    }
}
// Queue steps with no dependencies
for (const step of workflow.steps) {
    if (!dependentSteps.has(step.id)) {
        await this.queueWorkflowStep(workflow, execution, step);
    }
}
async;
queueWorkflowStep(workflow, WorkflowDefinition, execution, WorkflowExecution, step, WorkflowStep);
Promise < void  > {
    const: taskItem, TaskQueueItem = {
        id: this.generateId('task'),
        workflowExecutionId: execution.id,
        stepId: step.id,
        agentId: step.agentId,
        prompt: step.prompt,
        priority: 'normal',
        scheduledAt: new Date(),
        timeout: step.timeout || this.options.defaultTimeout || 120000,
        retries: 0,
        maxRetries: step.retries || this.options.maxRetries || 3,
        metadata: {
            expectedOutput: step.expectedOutput,
            fallbackAgents: step.fallbackAgents,
            conditions: step.conditions,
            parallel: step.parallel,
            optional: step.optional,
        },
    },
    this: .taskQueue.set(taskItem.id, taskItem),
    // Initialize step result
    execution, : .stepResults[step.id] = {
        stepId: step.id,
        agentId: step.agentId,
        status: 'pending',
        attempts: 0,
    },
    this: .emit('stepQueued', { execution, step, taskItem })
};
/**
 * Add a task to the queue
 */
async;
queueTask(task, (Omit));
Promise < TaskQueueItem > {
    const: taskItem, TaskQueueItem = {
        id: this.generateId('task'),
        scheduledAt: new Date(),
        retries: 0,
        ...task,
    },
    this: .taskQueue.set(taskItem.id, taskItem),
    // Update resource allocation
    this: .updateResourceAllocation(task.agentId, 1),
    this: .emit('taskQueued', taskItem),
    return: taskItem
};
startProcessing();
void {
    const: interval = this.options.processingInterval || 1000,
    this: .processingInterval = setInterval(async () => {
        if (this.isProcessing)
            return;
        this.isProcessing = true;
        try {
            await this.processQueue();
        }
        catch (error) {
            console.error('Error processing task queue:', error);
            this.emit('processingError', error);
        }
        finally {
            this.isProcessing = false;
        }
    }, interval)
};
async;
processQueue();
Promise < void  > {
    const: tasks = Array.from(this.taskQueue.values())
        .filter(task => this.canExecuteTask(task))
        .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
        .slice(0, this.options.maxConcurrentTasks || 10),
    for(, task, of, tasks) {
        try {
            await this.executeTask(task);
        }
        catch (error) {
            await this.handleTaskError(task, error);
        }
    }
};
canExecuteTask(task, TaskQueueItem);
boolean;
{
    // Check if agent is overloaded
    const allocation = this.resourceAllocations.get(task.agentId);
    if (allocation?.overloaded) {
        return false;
    }
    // Check dependencies
    if (task.dependencies) {
        return task.dependencies.every(depId => {
            const depTask = Array.from(this.taskQueue.values()).find(t => t.id === depId);
            return !depTask; // Dependency completed (removed from queue)
        });
    }
    return true;
}
async;
executeTask(task, TaskQueueItem);
Promise < void  > {
    this: .taskQueue.delete(task.id),
    // Update step result if this is part of a workflow
    if(task) { }, : .workflowExecutionId && task.stepId
};
{
    const execution = this.executions.get(task.workflowExecutionId);
    if (execution && execution.stepResults[task.stepId]) {
        execution.stepResults[task.stepId].status = 'running';
        execution.stepResults[task.stepId].startedAt = new Date();
        execution.stepResults[task.stepId].attempts++;
    }
}
this.emit('taskStarted', task);
// Simulate task execution - in real implementation, this would delegate to AgentHub
const result = await this.delegateToAgent(task);
// Handle task completion
await this.handleTaskCompletion(task, result);
async;
delegateToAgent(task, TaskQueueItem);
Promise < any > {
    // This would integrate with AgentHub in the real implementation
    // For now, simulate execution
    return: new Promise((resolve) => {
        setTimeout(() => {
            resolve(Task, $, { task, : .id }, completed, by, agent, $, { task, : .agentId } `);
      }, Math.random() * 2000 + 1000);
    });
  }

  /**
   * Handle task completion
   */
  private async handleTaskCompletion(task: TaskQueueItem, result: any): Promise<void> {
    // Update resource allocation
    this.updateResourceAllocation(task.agentId, -1);

    // Update step result if this is part of a workflow
    if (task.workflowExecutionId && task.stepId) {
      const execution = this.executions.get(task.workflowExecutionId);
      if (execution && execution.stepResults[task.stepId]) {
        const stepResult = execution.stepResults[task.stepId];
        stepResult.status = 'completed';
        stepResult.output = result;
        stepResult.completedAt = new Date();
        if (stepResult.startedAt) {
          stepResult.duration = stepResult.completedAt.getTime() - stepResult.startedAt.getTime();
        }

        // Check if this enables next steps
        await this.checkAndQueueNextSteps(execution);
      }
    }

    this.emit('taskCompleted', { task, result });
  }

  /**
   * Handle task error
   */
  private async handleTaskError(task: TaskQueueItem, error: any): Promise<void> {
    task.retries++;

    if (task.retries < (task.maxRetries || 3)) {
      // Retry with exponential backoff
      const delay = Math.pow(2, task.retries) * 1000;
      setTimeout(() => {
        if (task.metadata?.fallbackAgents && task.metadata.fallbackAgents.length > 0) {
          // Try fallback agent
          const fallbackAgent = task.metadata.fallbackAgents[task.retries - 1];
          if (fallbackAgent) {
            task.agentId = fallbackAgent;
          }
        }
        this.taskQueue.set(task.id, task);
      }, delay);
    } else {
      // Task failed permanently
      this.updateResourceAllocation(task.agentId, -1);

      if (task.workflowExecutionId && task.stepId) {
        const execution = this.executions.get(task.workflowExecutionId);
        if (execution && execution.stepResults[task.stepId]) {
          execution.stepResults[task.stepId].status = 'failed';
          execution.stepResults[task.stepId].error = error.message;
          execution.stepResults[task.stepId].completedAt = new Date();

          // Check if step is optional
          if (task.metadata?.optional) {
            execution.stepResults[task.stepId].status = 'skipped';
            await this.checkAndQueueNextSteps(execution);
          } else {
            // Fail the entire workflow
            execution.status = 'failed';
            execution.error = Step ${task.stepId} failed: ${error.message};
            execution.completedAt = new Date();
          }
        }
      }

      this.emit('taskFailed', { task, error });
    }
  }

  /**
   * Check and queue next workflow steps
   */
  private async checkAndQueueNextSteps(execution: WorkflowExecution): Promise<void> {
    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) return;

    // Check if workflow is complete
    const allStepsCompleted = workflow.steps.every(step => {
      const result = execution.stepResults[step.id];
      return result && (result.status === 'completed' || result.status === 'skipped' || 
             (result.status === 'failed' && step.optional));
    });

    if (allStepsCompleted) {
      execution.status = 'completed';
      execution.completedAt = new Date();
      this.emit('workflowCompleted', execution);
      return;
    }

    // Find steps that can now be executed
    if (workflow.dependencies) {
      for (const step of workflow.steps) {
        const stepResult = execution.stepResults[step.id];
        if (stepResult && stepResult.status !== 'pending') continue;

        const dependencies = workflow.dependencies.filter(d => d.stepId === step.id);
        const canExecute = dependencies.every(dep => this.isDependencySatisfied(dep, execution));

        if (canExecute) {
          await this.queueWorkflowStep(workflow, execution, step);
        }
      }
    }
  }

  /**
   * Check if a dependency is satisfied
   */
  private isDependencySatisfied(dependency: WorkflowDependency, execution: WorkflowExecution): boolean {
    const results = dependency.dependsOn.map(stepId => execution.stepResults[stepId]);

    switch (dependency.condition || 'all') {
      case 'all':
        return results.every(r => r && r.status === 'completed');
      case 'any':
        return results.some(r => r && r.status === 'completed');
      case 'custom':
        if (dependency.customCondition) {
          const stepResults = dependency.dependsOn.reduce((acc, stepId) => {
            acc[stepId] = execution.stepResults[stepId];
            return acc;
          }, {} as Record<string, any>);
          return dependency.customCondition(stepResults);
        }
        return false;
      default:
        return false;
    }
  }

  /**
   * Update resource allocation for an agent
   */
  private updateResourceAllocation(agentId: string, change: number): void {
    let allocation = this.resourceAllocations.get(agentId);
    if (!allocation) {
      allocation = {
        agentId,
        maxConcurrentTasks: 5, // Default limit
        currentTasks: 0,
        queuedTasks: 0,
        lastActivity: new Date(),
        overloaded: false,
      };
      this.resourceAllocations.set(agentId, allocation);
    }

    if (change > 0) {
      allocation.currentTasks += change;
    } else {
      allocation.currentTasks = Math.max(0, allocation.currentTasks + change);
    }

    allocation.lastActivity = new Date();
    allocation.overloaded = allocation.currentTasks >= allocation.maxConcurrentTasks;

    this.emit('resourceAllocationUpdated', allocation);
  }

  /**
   * Get priority weight for sorting
   */
  private getPriorityWeight(priority: string): number {
    const weights = { urgent: 4, high: 3, normal: 2, low: 1 };
    return weights[priority as keyof typeof weights] || 2;
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get all executions
   */
  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }

  /**
   * Get task queue status
   */
  getQueueStatus(): any {
    const tasks = Array.from(this.taskQueue.values());
    return {
      totalTasks: tasks.length,
      byPriority: {
        urgent: tasks.filter(t => t.priority === 'urgent').length,
        high: tasks.filter(t => t.priority === 'high').length,
        normal: tasks.filter(t => t.priority === 'normal').length,
        low: tasks.filter(t => t.priority === 'low').length,
      },
      resourceAllocations: Array.from(this.resourceAllocations.values()),
    };
  }

  /**
   * Cancel workflow execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);`);
            if (!execution) {
                `
      throw new Error(Execution not found: ${executionId}`;
            }
        });
    }, execution.status = 'cancelled'),
    execution, : .completedAt = new Date(),
    // Remove related tasks from queue
    const: tasksToRemove = Array.from(this.taskQueue.values())
        .filter(task => task.workflowExecutionId === executionId),
    for(, task, of, tasksToRemove) {
        this.taskQueue.delete(task.id);
        this.updateResourceAllocation(task.agentId, -1);
    },
    this: .emit('workflowCancelled', execution)
};
generateId(prefix, string);
string;
{
    return $;
    {
        prefix;
    }
    _$;
    {
        Date.now();
    }
    _$;
    {
        Math.random().toString(36).substr(2, 9);
    }
    `;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.workflows.clear();
    this.executions.clear();
    this.taskQueue.clear();
    this.resourceAllocations.clear();

    this.emit('cleanup');
  }
}

export default TaskOrchestrator;;
}
//# sourceMappingURL=TaskOrchestrator.js.map