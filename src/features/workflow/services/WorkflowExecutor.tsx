import { v4 as uuidv4 } from 'uuid';
import { 
  Workflow, 
  WorkflowExecution, 
  WorkflowExecutionStatus, 
  WorkflowStep, 
  WorkflowStepResult 
} from '../types.js';
import { WorkflowPersistenceService } from './WorkflowPersistence.js';

/**
 * Service responsible for executing workflows
 */
export class WorkflowExecutorService {
  private persistenceService: WorkflowPersistenceService;
  
  constructor(persistenceService: WorkflowPersistenceService) {
    this.persistenceService = persistenceService;
  }
  
  /**
   * Start a new workflow execution
   */
  async startExecution(workflow: Workflow, initialData?: Record<string, any>): Promise<WorkflowExecution> {
    // Find the first step
    const firstStep = workflow.steps.find(step => step.isStart);
    
    if (!firstStep) {
      throw new Error('Workflow has no start step');
    }
    
    // Create a new execution
    const execution: WorkflowExecution = {
      id: uuidv4(),
      workflowId: workflow.id,
      status: WorkflowExecutionStatus.RUNNING,
      currentStepId: firstStep.id,
      startTime: new Date().toISOString(),
      data: initialData || {},
      results: {},
      error: null
    };
    
    // Save the execution
    await this.persistenceService.saveExecution(execution);
    
    return execution;
  }
  
  /**
   * Execute the current step of a workflow
   */
  async executeStep(
    execution: WorkflowExecution, 
    workflow: Workflow, 
    stepHandlers: Record<string, (step: WorkflowStep, data: any) => Promise<WorkflowStepResult>>
  ): Promise<WorkflowExecution> {
    // Get the current step
    const currentStep = workflow.steps.find(step => step.id === execution.currentStepId);
    
    if (!currentStep) {
      throw new Error(`Step ${execution.currentStepId} not found in workflow`);
    }
    
    // Get the handler for this step type
    const handler = stepHandlers[currentStep.type];
    
    if (!handler) {
      throw new Error(`No handler found for step type ${currentStep.type}`);
    }
    
    try {
      // Execute the step
      const result = await handler(currentStep, execution.data);
      
      // Update the execution with the result
      execution.results[currentStep.id] = result;
      
      // Merge the result data with the execution data
      execution.data = {
        ...execution.data,
        ...result.data
      };
      
      // Determine the next step
      if (currentStep.next) {
        execution.currentStepId = currentStep.next;
      } else {
        // No next step, workflow is complete
        execution.status = WorkflowExecutionStatus.COMPLETED;
        execution.endTime = new Date().toISOString();
      }
    } catch (error) {
      // Handle error
      execution.status = WorkflowExecutionStatus.FAILED;
      execution.error = error instanceof Error ? error.message : String(error);
      execution.endTime = new Date().toISOString();
    }
    
    // Save the updated execution
    await this.persistenceService.saveExecution(execution);
    
    return execution;
  }
  
  /**
   * Resume a paused workflow execution
   */
  async resumeExecution(executionId: string): Promise<WorkflowExecution | null> {
    const execution = await this.persistenceService.getExecution(executionId);
    
    if (!execution) {
      return null;
    }
    
    if (execution.status === WorkflowExecutionStatus.PAUSED) {
      execution.status = WorkflowExecutionStatus.RUNNING;
      await this.persistenceService.saveExecution(execution);
    }
    
    return execution;
  }
  
  /**
   * Pause a running workflow execution
   */
  async pauseExecution(executionId: string): Promise<WorkflowExecution | null> {
    const execution = await this.persistenceService.getExecution(executionId);
    
    if (!execution) {
      return null;
    }
    
    if (execution.status === WorkflowExecutionStatus.RUNNING) {
      execution.status = WorkflowExecutionStatus.PAUSED;
      await this.persistenceService.saveExecution(execution);
    }
    
    return execution;
  }
  
  /**
   * Cancel a workflow execution
   */
  async cancelExecution(executionId: string): Promise<WorkflowExecution | null> {
    const execution = await this.persistenceService.getExecution(executionId);
    
    if (!execution) {
      return null;
    }
    
    if (execution.status === WorkflowExecutionStatus.RUNNING || 
        execution.status === WorkflowExecutionStatus.PAUSED) {
      execution.status = WorkflowExecutionStatus.CANCELLED;
      execution.endTime = new Date().toISOString();
      await this.persistenceService.saveExecution(execution);
    }
    
    return execution;
  }
}
