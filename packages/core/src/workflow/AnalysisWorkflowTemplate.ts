import { WorkflowStep } from '../types.js';

export class AnalysisWorkflowTemplate {
  private steps: WorkflowStep[];

  constructor() {
    this.steps = [
      {
        name: 'Step 1',
        type: 'analysis',
        parameters: {},
        retryPolicy: {
          maxAttempts: 3,
          initialDelay: 1000,
          backoffMultiplier: 2
        }
      },
      {
        name: 'Step 2',
        type: 'visualization',
        parameters: {},
        retryPolicy: {
          maxAttempts: 3,
          initialDelay: 1000,
          backoffMultiplier: 2
        }
      },
      {
        name: 'Step 3',
        type: 'integration',
        parameters: {},
        retryPolicy: {
          maxAttempts: 3,
          initialDelay: 1000,
          backoffMultiplier: 2
        }
      }
    ];
  }

  getSteps(): WorkflowStep[] {
    return this.steps;
  }

  // Additional methods for managing workflow steps
}
