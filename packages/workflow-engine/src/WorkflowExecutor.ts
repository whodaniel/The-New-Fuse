/**
 * Workflow Executor - The New Fuse
 *
 * This class handles the runtime execution and state tracking of workflows.
 * It interacts with the WorkflowEngine to get definitions and the MasterAgentRegistry
 * to dispatch tasks to agents.
 */

import { EventEmitter } from 'events';
import { Logger } from '@tnf/relay-core';
import { MasterAgentRegistry } from '@tnf/relay-core';
import { WorkflowEngine } from './WorkflowEngine';
import {
  WorkflowInstance,
  WorkflowStep,
  WorkflowStepStatus,
  StepType,
  WorkflowTask,
} from './WorkflowTypes';
// import { TaskPriority, TaskStatus } from '@the-new-fuse/database';
import { TaskPriority, TaskStatus } from './WorkflowTypes';

export class WorkflowExecutor extends EventEmitter {
  private logger: Logger;
  private agentRegistry: MasterAgentRegistry;
  private workflowEngine: WorkflowEngine;
  private runningInstances: Map<string, WorkflowInstance> = new Map();

  constructor(
    logger: Logger,
    agentRegistry: MasterAgentRegistry,
    workflowEngine: WorkflowEngine
  ) {
    super();
    this.logger = logger;
    this.agentRegistry = agentRegistry;
    this.workflowEngine = workflowEngine;
  }

  public async executeWorkflow(workflowId: string, inputs: Record<string, any>): Promise<string> {
    const workflow = await this.workflowEngine.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow with id ${workflowId} not found.`);
    }

    const instanceId = `wf_run_${Date.now()}`;
    const instance: WorkflowInstance = {
      id: instanceId,
      workflowDefinitionId: workflow.id,
      workflowVersion: workflow.version,
      status: WorkflowStepStatus.RUNNING,
      inputs,
      startedAt: new Date(),
      stepStates: new Map(),
      triggeredBy: 'manual', // Simplified for now
    };

    this.runningInstances.set(instanceId, instance);
    this.logger.info(`Executing workflow: ${workflow.name} (Instance: ${instanceId})`);
    this.emit('workflow_started', instance);

    const startStep = workflow.steps.find(s => s.type === StepType.START)!;
    this.scheduleNextSteps(instance, startStep);

    return instanceId;
  }

  private async scheduleNextSteps(instance: WorkflowInstance, completedStep: WorkflowStep) {
    const workflow = await this.workflowEngine.getWorkflow(instance.workflowDefinitionId);
    if (!workflow) return;

    const nextEdges = workflow.edges.filter(e => e.sourceStepId === completedStep.id);
    for (const edge of nextEdges) {
      const nextStep = workflow.steps.find(s => s.id === edge.targetStepId);
      if (nextStep) {
        this.executeStep(instance, nextStep);
      }
    }
  }

  private async executeStep(instance: WorkflowInstance, step: WorkflowStep) {
    this.logger.info(`Executing step: ${step.name} for instance ${instance.id}`);
    const stepState = {
        stepId: step.id,
        status: WorkflowStepStatus.RUNNING,
        startedAt: new Date(),
        attempt: 1,
        inputs: {}, // TODO: Map inputs
        logs: [],
    };
    instance.stepStates.set(step.id, stepState);

    if (step.type === StepType.END) {
        stepState.status = WorkflowStepStatus.COMPLETED;
        this.logger.info(`Workflow instance ${instance.id} reached an END step.`);
        // Check if all paths are completed
        if (this.isWorkflowComplete(instance)) {
            instance.status = WorkflowStepStatus.COMPLETED;
            instance.completedAt = new Date();
            this.emit('workflow_completed', instance);
        }
        return;
    }

    // For now, we only handle TASK steps
    if (step.type === StepType.TASK && step.task) {
      const task: WorkflowTask = {
        id: `task_${instance.id}_${step.id}`,
        workflowInstanceId: instance.id,
        workflowStepId: step.id,
        title: step.name,
        description: step.description || '',
        action: step.task.action,
        params: step.task.params,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // This is where we would typically emit an event to the orchestrator
      this.emit('task_created', task);
      this.logger.info(`Task created: ${task.title}`);
      // In a real implementation, we would wait for an event back from the orchestrator
      // For this simulation, we'll just mark it as complete and move on.
      setTimeout(() => this.handleTaskCompletion(instance.id, step.id, { success: true }), 1000);
    }
  }

  public handleTaskCompletion(instanceId: string, stepId: string, result: any) {
    const instance = this.runningInstances.get(instanceId);
    if (!instance) return;

    const stepState = instance.stepStates.get(stepId);
    if (stepState) {
      stepState.status = result.success ? WorkflowStepStatus.COMPLETED : WorkflowStepStatus.FAILED;
      stepState.completedAt = new Date();
      stepState.outputs = result;
      this.logger.info(`Step ${stepId} completed for instance ${instanceId} with status ${stepState.status}`);

      if (stepState.status === WorkflowStepStatus.COMPLETED) {
        this.workflowEngine.getWorkflow(instance.workflowDefinitionId).then(workflow => {
            if(workflow) {
                const step = workflow.steps.find(s => s.id === stepId);
                if (step) {
                    this.scheduleNextSteps(instance, step);
                }
            }
        });
      } else {
        instance.status = WorkflowStepStatus.FAILED;
        this.emit('workflow_failed', instance);
      }
    }
  }

  private isWorkflowComplete(_instance: WorkflowInstance): boolean {
    // Simplified: assumes completion if an END step is reached.
    // A more robust implementation would check if all paths have concluded.
    return true;
  }
}
