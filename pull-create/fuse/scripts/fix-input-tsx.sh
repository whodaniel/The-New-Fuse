#!/bin/bash

# Fix src/core/input/Input.tsx
cat > src/core/input/Input.tsx << 'EOL'
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        outline: "border-2",
        ghost: "border-none shadow-none",
        underline: "border-0 border-b-2 rounded-none px-0",
      },
      size: {
        default: "h-10 px-3 py-2",
        sm: "h-8 px-2 py-1 text-xs",
        lg: "h-12 px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
  errorMessage?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, leftIcon, rightIcon, error, errorMessage, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        <input
          className={cn(
            inputVariants({ variant, size }),
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        )}
        {error && errorMessage && (
          <p className="mt-1 text-xs text-destructive">{errorMessage}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
EOL

# Fix src/features/workflow/services/WorkflowExecutor.tsx
cat > src/features/workflow/services/WorkflowExecutor.tsx << 'EOL'
import { v4 as uuidv4 } from 'uuid';
import { 
  Workflow, 
  WorkflowExecution, 
  WorkflowExecutionStatus, 
  WorkflowStep, 
  WorkflowStepResult 
} from '../types';
import { WorkflowPersistenceService } from './WorkflowPersistence';

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
EOL

# Fix src/features/workflow/testing/WorkflowTestUtils.tsx
cat > src/features/workflow/testing/WorkflowTestUtils.tsx << 'EOL'
import { v4 as uuidv4 } from 'uuid';
import { 
  Workflow, 
  WorkflowExecution, 
  WorkflowExecutionStatus, 
  WorkflowStep, 
  WorkflowStepResult 
} from '../types';

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
EOL

echo "Fixed TypeScript files successfully!"
