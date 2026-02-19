/**
 * Workflow Executor - The New Fuse
 *
 * This class handles the runtime execution and state tracking of workflows.
 * It interacts with the WorkflowEngine to get definitions and the MasterAgentRegistry
 * to dispatch tasks to agents.
 */

import { Logger, MasterAgentRegistry } from '@the-new-fuse/relay-core';
import { EventEmitter } from 'events';
import { WorkflowEngine } from './WorkflowEngine';
import {
  StepType,
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowStep,
  WorkflowStepStatus,
  WorkflowTask,
} from './WorkflowTypes';
// import { TaskPriority, TaskStatus } from '@the-new-fuse/database';
import { TaskPriority, TaskStatus } from './WorkflowTypes';

export class WorkflowExecutor extends EventEmitter {
  private logger: Logger;
  private agentRegistry: MasterAgentRegistry;
  private workflowEngine: WorkflowEngine;
  private runningInstances: Map<string, WorkflowInstance> = new Map();

  constructor(logger: Logger, agentRegistry: MasterAgentRegistry, workflowEngine: WorkflowEngine) {
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

    const startStep = workflow.steps.find((s) => s.type === StepType.START);
    if (startStep) {
      this.scheduleNextSteps(instance, startStep);
    } else {
      this.scheduleEntrySteps(instance, workflow);
    }

    return instanceId;
  }

  private scheduleEntrySteps(instance: WorkflowInstance, workflow: WorkflowDefinition) {
    const targetIds = new Set(workflow.edges.map((e) => e.targetStepId));
    const entrySteps = workflow.steps.filter((s: WorkflowStep) => !targetIds.has(s.id));
    const stepsToRun = entrySteps.length > 0 ? entrySteps : workflow.steps;

    for (const step of stepsToRun) {
      if (step.type !== StepType.START) {
        this.executeStep(instance, step);
      }
    }
  }

  private async scheduleNextSteps(instance: WorkflowInstance, completedStep: WorkflowStep) {
    if (!completedStep?.id) {
      return;
    }
    const workflow = await this.workflowEngine.getWorkflow(instance.workflowDefinitionId);
    if (!workflow) return;

    const nextEdges = workflow.edges.filter((e) => e.sourceStepId === completedStep.id);
    for (const edge of nextEdges) {
      const nextStep = workflow.steps.find((s) => s.id === edge.targetStepId);
      if (nextStep) {
        this.executeStep(instance, nextStep);
      }
    }
  }

  // Generalized value resolver (replaces old resolveInputs)
  private resolveValue(value: any, instance: WorkflowInstance): any {
    if (typeof value === 'string') {
      if (value.startsWith('workflow.inputs.')) {
        const inputKey = value.replace('workflow.inputs.', '');
        return instance.inputs[inputKey];
      } else if (value.startsWith('outputs.')) {
        // e.g., "outputs.stepId.key"
        const parts = value.split('.');
        if (parts.length >= 3) {
          const stepId = parts[1];
          const outputKey = parts.slice(2).join('.');
          const stepState = instance.stepStates.get(stepId);
          if (stepState && stepState.outputs) {
            return stepState.outputs[outputKey];
          }
        }
      }
    }
    return value;
  }

  // Resolve all inputs for a step using the mapping
  private resolveInputs(step: WorkflowStep, instance: WorkflowInstance): Record<string, any> {
    const resolved: Record<string, any> = {};
    for (const [key, value] of Object.entries(step.inputs)) {
      resolved[key] = this.resolveValue(value, instance);
    }
    return resolved;
  }

  // Helper to resolve a template string with values
  private resolveTemplate(template: string, context: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(context)) {
      // Replace {{key}} with value
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
  }

  private async executeStep(instance: WorkflowInstance, step: WorkflowStep) {
    this.logger.info(`Executing step: ${step.name} for instance ${instance.id}`);
    const inputs = this.resolveInputs(step, instance);
    const stepState = {
      stepId: step.id,
      status: WorkflowStepStatus.RUNNING,
      startedAt: new Date(),
      attempt: 1,
      inputs,
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

    if (step.type === StepType.A2A_HANDOFF && step.a2aHandoff) {
      try {
        const { handoffSchema, contextInstructions } = step.a2aHandoff;
        const contextData: Record<string, any> = {};

        // Resolve data from schema using the helper
        for (const [key, sourcePath] of Object.entries(handoffSchema)) {
          contextData[key] = this.resolveValue(sourcePath, instance);
        }

        const contextString = JSON.stringify(contextData, null, 2);
        const fullContext = contextInstructions
          ? `${contextInstructions}\n\nContext Data:\n${contextString}`
          : `Context Data:\n${contextString}`;

        // Note: This relies on sequential execution.
        // If the workflow branches, multiple steps might inherit this context.
        instance.pendingContext = fullContext;

        this.logger.info(`A2A Handoff context prepared for instance ${instance.id}`);

        // Mark step as complete immediately
        this.handleTaskCompletion(instance.id, step.id, { success: true, context: contextData });
      } catch (error: any) {
        this.logger.error(`A2A Handoff failed: ${error.message}`);
        this.handleTaskCompletion(instance.id, step.id, { success: false, error: error.message });
      }
      return;
    }

    if (step.type === StepType.NOTIFICATION && step.notification) {
      try {
        const { channelSelector, config, template } = step.notification;
        const message = this.resolveTemplate(template, inputs);

        this.logger.info(`Notification requested via ${channelSelector}`);

        this.emit('notification_requested', {
          workflowInstanceId: instance.id,
          stepId: step.id,
          channel: channelSelector,
          config,
          message,
        });

        // Optimistic completion without artificial delay
        this.handleTaskCompletion(instance.id, step.id, { success: true });
      } catch (error: any) {
        this.logger.error(`Notification failed: ${error.message}`);
        this.handleTaskCompletion(instance.id, step.id, { success: false, error: error.message });
      }
      return;
    }

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

      // Check for pending context from A2A Handoff
      if (instance.pendingContext) {
        task.context = instance.pendingContext;
        // Prepend to description for visibility (or use the context field if the agent supports it)
        task.description = `[System Context]: ${instance.pendingContext}\n\n${task.description}`;

        // Clear it so it doesn't propagate to subsequent tasks unintentionally
        instance.pendingContext = undefined;
      }

      // This is where we would typically emit an event to the orchestrator
      this.emit('task_created', task);
      this.logger.info(`Task created: ${task.title}`);

      // In a real implementation, we would wait for an event back from the orchestrator
      // For this simulation, we'll just mark it as complete and move on.
      // Reduced delay to 0 to act as next-tick execution
      setTimeout(() => this.handleTaskCompletion(instance.id, step.id, { success: true }), 0);
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
      this.logger.info(
        `Step ${stepId} completed for instance ${instanceId} with status ${stepState.status}`
      );

      if (stepState.status === WorkflowStepStatus.COMPLETED) {
        this.workflowEngine.getWorkflow(instance.workflowDefinitionId).then((workflow) => {
          if (workflow) {
            const step = workflow.steps.find((s) => s.id === stepId);
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
