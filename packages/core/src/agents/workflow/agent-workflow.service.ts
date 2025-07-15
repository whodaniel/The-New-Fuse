import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'task' | 'decision' | 'parallel' | 'sequential';
  config: any;
  dependencies?: string[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  variables?: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  currentStep?: string;
  results: Record<string, any>;
  error?: string;
}

@Injectable()
export class AgentWorkflowService {
  private readonly logger = new Logger(AgentWorkflowService.name);
  private workflows = new Map<string, WorkflowDefinition>();
  private executions = new Map<string, WorkflowExecution>();

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.logger.log('AgentWorkflowService initialized');
    this.setupWorkflowEventListeners();
  }

  private setupWorkflowEventListeners(): void {
    this.eventEmitter.on('workflow.started', (data) => {
      this.logger.log(`Workflow started: ${data.workflowId}`);
    });

    this.eventEmitter.on('workflow.completed', (data) => {
      this.logger.log(`Workflow completed: ${data.workflowId}`);
    });

    this.eventEmitter.on('workflow.failed', (data) => {
      this.logger.error(`Workflow failed: ${data.workflowId} - ${data.error}`);
    });

    this.eventEmitter.on('workflow.cancelled', (data) => {
      this.logger.log(`Workflow cancelled: ${data.workflowId}`);
    });
  }

  async createWorkflow(definition: Omit<WorkflowDefinition, 'id'>): Promise<WorkflowDefinition> {
    const workflow: WorkflowDefinition = {
      id: uuidv4(),
      ...definition
    };

    this.workflows.set(workflow.id, workflow);
    this.logger.log(`Created workflow: ${workflow.id} - ${workflow.name}`);

    return workflow;
  }

  async executeWorkflow(workflowId: string, variables?: Record<string, any>): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const execution: WorkflowExecution = {
      id: uuidv4(),
      workflowId,
      status: 'running',
      startTime: new Date(),
      results: {},
      currentStep: workflow.steps[0]?.id
    };

    this.executions.set(execution.id, execution);

    try {
      this.eventEmitter.emit('workflow.started', { workflowId, executionId: execution.id });
      
      // Execute workflow steps
      await this.executeSteps(workflow, execution, variables);
      
      execution.status = 'completed';
      execution.endTime = new Date();
      
      this.eventEmitter.emit('workflow.completed', { workflowId, executionId: execution.id });
      
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      
      this.eventEmitter.emit('workflow.failed', { 
        workflowId, 
        executionId: execution.id, 
        error: execution.error 
      });
    }

    return execution;
  }

  private async executeSteps(
    workflow: WorkflowDefinition, 
    execution: WorkflowExecution, 
    variables?: Record<string, any>
  ): Promise<void> {
    for (const step of workflow.steps) {
      execution.currentStep = step.id;
      
      try {
        const result = await this.executeStep(step, variables);
        execution.results[step.id] = result;
        
        this.logger.log(`Step completed: ${step.id} in workflow ${workflow.id}`);
      } catch (error) {
        this.logger.error(`Step failed: ${step.id} in workflow ${workflow.id}`, error);
        throw error;
      }
    }
  }

  private async executeStep(step: WorkflowStep, variables?: Record<string, any>): Promise<any> {
    // Implementation would depend on step type
    switch (step.type) {
      case 'task':
        return this.executeTaskStep(step, variables);
      case 'decision':
        return this.executeDecisionStep(step, variables);
      case 'parallel':
        return this.executeParallelStep(step, variables);
      case 'sequential':
        return this.executeSequentialStep(step, variables);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeTaskStep(step: WorkflowStep, variables?: Record<string, any>): Promise<any> {
    // Execute task logic
    return { success: true, message: `Task ${step.id} executed` };
  }

  private async executeDecisionStep(step: WorkflowStep, variables?: Record<string, any>): Promise<any> {
    // Execute decision logic
    return { decision: true, branch: 'success' };
  }

  private async executeParallelStep(step: WorkflowStep, variables?: Record<string, any>): Promise<any> {
    // Execute parallel tasks
    return { parallelResults: [] };
  }

  private async executeSequentialStep(step: WorkflowStep, variables?: Record<string, any>): Promise<any> {
    // Execute sequential tasks
    return { sequentialResults: [] };
  }

  async getWorkflow(workflowId: string): Promise<WorkflowDefinition | undefined> {
    return this.workflows.get(workflowId);
  }

  async getExecution(executionId: string): Promise<WorkflowExecution | undefined> {
    return this.executions.get(executionId);
  }

  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    if (execution.status === 'running') {
      execution.status = 'cancelled';
      execution.endTime = new Date();
      
      this.eventEmitter.emit('workflow.cancelled', { 
        workflowId: execution.workflowId, 
        executionId 
      });
    }
  }

  async listWorkflows(): Promise<WorkflowDefinition[]> {
    return Array.from(this.workflows.values());
  }

  async listExecutions(workflowId?: string): Promise<WorkflowExecution[]> {
    const executions = Array.from(this.executions.values());
    return workflowId 
      ? executions.filter(e => e.workflowId === workflowId)
      : executions;
  }
}