import { v4 as uuidv4 } from 'uuid';
import { 
  Workflow, 
  WorkflowExecution, 
  WorkflowExecutionStatus, 
  WorkflowStep, 
  WorkflowStepResult 
} from '../types.js';

/**
 * Utility class for creating test workflows and executions
 */
export class WorkflowTestUtils {
  /**
   * Create a test workflow with the specified number of steps
   */
  static createTestWorkflow(numSteps: number = 3): Workflow {
    const steps: WorkflowStep[] = [];
    
    for (let i = 0; i < numSteps; i++) {
      steps.push({
        id: `step-${i + 1}`,
        name: `Step ${i + 1}`,
        type: "test",
        action: `Test Action ${i + 1}`,
        parameters: { testParam: `value-${i + 1}` },
        next: i < numSteps - 1 ? `step-${i + 2}` : null,
        isStart: i === 0
      });
    }
    
    return {
      id: uuidv4(),
      name: "Test Workflow",
      description: "A workflow created for testing purposes",
      version: "1.0.0",
      steps
    };
  }
  
  /**
   * Create a test workflow execution
   */
  static createTestExecution(workflow: Workflow, status: WorkflowExecutionStatus = WorkflowExecutionStatus.RUNNING): WorkflowExecution {
    const startStep = workflow.steps.find(step => step.isStart);
    
    if (!startStep) {
      throw new Error("Workflow has no start step");
    }
    
    return {
      id: uuidv4(),
      workflowId: workflow.id,
      status,
      currentStepId: startStep.id,
      startTime: new Date().toISOString(),
      data: { testData: "initial value" },
      results: {},
      error: null
    };
  }
  
  /**
   * Create a test step result
   */
  static createTestStepResult(success: boolean = true, data: Record<string, any> = {}): WorkflowStepResult {
    return {
      success,
      data,
      message: success ? "Step completed successfully" : "Step failed",
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Add a test result to an execution
   */
  static addTestResult(
    execution: WorkflowExecution, 
    stepId: string, 
    result: WorkflowStepResult
  ): WorkflowExecution {
    return {
      ...execution,
      results: {
        ...execution.results,
        [stepId]: result
      },
      data: {
        ...execution.data,
        ...result.data
      }
    };
  }
  
  /**
   * Complete a test execution
   */
  static completeExecution(execution: WorkflowExecution): WorkflowExecution {
    return {
      ...execution,
      status: WorkflowExecutionStatus.COMPLETED,
      endTime: new Date().toISOString()
    };
  }
  
  /**
   * Fail a test execution
   */
  static failExecution(execution: WorkflowExecution, error: string): WorkflowExecution {
    return {
      ...execution,
      status: WorkflowExecutionStatus.FAILED,
      error,
      endTime: new Date().toISOString()
    };
  }
}
