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

export interface WorkflowEventData {
  workflowId: string;
  executionId: string;
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
    this.eventEmitter.on('workflow.started', (data: WorkflowEventData) => {
      this.logger.log(`Workflow started: ${data.workflowId}`);
    });

    this.eventEmitter.on('workflow.completed', (data: WorkflowEventData) => {
      this.logger.log(`Workflow completed: ${data.workflowId}`);
    });

    this.eventEmitter.on('workflow.failed', (data: WorkflowEventData) => {
      this.logger.error(`Workflow failed: ${data.workflowId} - ${data.error}`);
    });

    this.eventEmitter.on('workflow.cancelled', (data: WorkflowEventData) => {
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
      await this.executeSteps(workflow, execution, variables || {});
      
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
      throw error;
    }

    return execution;
  }

  private async executeSteps(
    workflow: WorkflowDefinition, 
    execution: WorkflowExecution, 
    variables: Record<string, any>
  ): Promise<void> {
    for (const step of workflow.steps) {
      // Check if step dependencies are satisfied
      if (step.dependencies) {
        const unsatisfiedDeps = step.dependencies.filter(depId => 
          !execution.results[depId]
        );
        
        if (unsatisfiedDeps.length > 0) {
          throw new Error(`Unsatisfied dependencies for step ${step.id}: ${unsatisfiedDeps.join(', ')}`);
        }
      }

      execution.currentStep = step.id;
      this.logger.debug(`Executing step: ${step.id} - ${step.name}`);

      try {
        const stepResult = await this.executeStep(step, execution.results, variables);
        execution.results[step.id] = stepResult;
        
        this.eventEmitter.emit('workflow.step.completed', {
          workflowId: workflow.id,
          executionId: execution.id,
          stepId: step.id,
          result: stepResult
        });
      } catch (error) {
        this.logger.error(`Step execution failed: ${step.id}`, error);
        throw new Error(`Step ${step.id} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private async executeStep(
    step: WorkflowStep, 
    previousResults: Record<string, any>, 
    variables: Record<string, any>
  ): Promise<any> {
    const context = {
      step,
      previousResults,
      variables
    };

    switch (step.type) {
      case 'task':
        return await this.executeTaskStep(context);
      case 'decision':
        return await this.executeDecisionStep(context);
      case 'parallel':
        return await this.executeParallelStep(context);
      case 'sequential':
        return await this.executeSequentialStep(context);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeTaskStep(context: any): Promise<any> {
    // Implementation for task execution
    this.logger.debug(`Executing task step: ${context.step.id}`);
    
    // Simulate task execution
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      stepId: context.step.id,
      status: 'completed',
      timestamp: new Date(),
      output: context.step.config
    };
  }

  private async executeDecisionStep(context: any): Promise<any> {
    // Implementation for decision logic
    this.logger.debug(`Executing decision step: ${context.step.id}`);
    
    const condition = context.step.config.condition || true;
    return {
      stepId: context.step.id,
      decision: condition,
      timestamp: new Date()
    };
  }

  private async executeParallelStep(context: any): Promise<any> {
    // Implementation for parallel execution
    this.logger.debug(`Executing parallel step: ${context.step.id}`);
    
    const tasks = context.step.config.tasks || [];
    const results = await Promise.all(
      tasks.map((task: any) => this.executeTaskStep({ ...context, step: { ...context.step, config: task } }))
    );
    
    return {
      stepId: context.step.id,
      results,
      timestamp: new Date()
    };
  }

  private async executeSequentialStep(context: any): Promise<any> {
    // Implementation for sequential execution
    this.logger.debug(`Executing sequential step: ${context.step.id}`);
    
    const tasks = context.step.config.tasks || [];
    const results: any[] = [];
    
    for (const task of tasks) {
      const result = await this.executeTaskStep({ ...context, step: { ...context.step, config: task } });
      results.push(result);
    }
    
    return {
      stepId: context.step.id,
      results,
      timestamp: new Date()
    };
  }

  async pauseWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    execution.status = 'pending'; // Paused state
    this.logger.log(`Workflow paused: ${execution.workflowId}`);
    
    this.eventEmitter.emit('workflow.paused', {
      workflowId: execution.workflowId,
      executionId
    });
  }

  async cancelWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    execution.status = 'cancelled';
    execution.endTime = new Date();
    
    this.eventEmitter.emit('workflow.cancelled', {
      workflowId: execution.workflowId,
      executionId
    });
    
    this.logger.log(`Workflow cancelled: ${execution.workflowId}`);
  }

  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId);
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }

  getExecutionsForWorkflow(workflowId: string): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter(execution => 
      execution.workflowId === workflowId
    );
  }

  async deleteWorkflow(workflowId: string): Promise<boolean> {
    const deleted = this.workflows.delete(workflowId);
    if (deleted) {
      this.logger.log(`Deleted workflow: ${workflowId}`);
    }
    return deleted;
  }

  async deleteExecution(executionId: string): Promise<boolean> {
    const deleted = this.executions.delete(executionId);
    if (deleted) {
      this.logger.log(`Deleted execution: ${executionId}`);
    }
    return deleted;
  }

  getWorkflowStatus(workflowId: string): { 
    workflow: WorkflowDefinition | undefined;
    executions: WorkflowExecution[];
    activeExecutions: number;
  } {
    const workflow = this.workflows.get(workflowId);
    const executions = this.getExecutionsForWorkflow(workflowId);
    const activeExecutions = executions.filter(e => 
      e.status === 'running' || e.status === 'pending'
    ).length;

    return {
      workflow,
      executions,
      activeExecutions
    };
  }
}