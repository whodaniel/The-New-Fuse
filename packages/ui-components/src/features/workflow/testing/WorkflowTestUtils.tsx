import { WorkflowStep, WorkflowStatus, WorkflowState } from '../types.js';

export class WorkflowTestUtils {
  static createMockStep(overrides: Partial<WorkflowStep> = {}): WorkflowStep {
    return {
      id: `step-${Math.random().toString(36).substr(2, 9)}`,
      type: 'test',
      name: overrides.name || 'Test Step',
      action: 'test-action',
      parameters: {},
      ...overrides
    };
  }

  static createMockWorkflowState(overrides: Partial<WorkflowState> = {}): WorkflowState {
    return {
      status: WorkflowStatus.PENDING,
      completedSteps: [],
      ...overrides
    };
  }

  static async simulateStepExecution(
    step: WorkflowStep,
    delay: number = 1000
  ): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  static createTestWorkflow(numSteps: number): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    
    // Create steps with proper WorkflowStep references
    for (let i = 0; i < numSteps; i++) {
      steps.push({
        id: `step-${i + 1}`,
        type: 'test',
        name: `Test Step ${i + 1}`,
        action: `Test Action ${i + 1}`,
        parameters: { testParam: `value-${i + 1}` }
      });
    }
    
    // Connect steps after creation
    for (let i = 0; i < steps.length - 1; i++) {
      steps[i].next = steps[i + 1];
    }
    
    return steps;
  }
}