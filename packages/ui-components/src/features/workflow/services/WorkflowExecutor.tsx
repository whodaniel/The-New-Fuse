import { WorkflowStep, WorkflowCondition, WorkflowContext, ExecutionResult } from '../types';

// Define WorkflowMetricsTracker interface
export interface WorkflowMetricsTracker {
  initializeWorkflow(steps: WorkflowStep[]): void;
  recordStepCompletion(stepId: string, success: boolean): void;
  getMetrics(): any;
}

export class WorkflowExecutor {
  private context: WorkflowContext;
  private metricsTracker: WorkflowMetricsTracker;

  constructor(metricsTracker: WorkflowMetricsTracker) {
    this.metricsTracker = metricsTracker;
    this.context = { variables: {} };
  }

  public async executeWorkflow(steps: WorkflowStep[]): Promise<ExecutionResult> {
    this.metricsTracker.initializeWorkflow(steps);
    let currentStep: WorkflowStep | null = steps[0];

    while (currentStep) {
      try {
        const result = await this.executeStep(currentStep);
        this.context.variables[currentStep.id] = result;

        currentStep = await this.determineNextStep(currentStep, result);
        if (currentStep) {
          this.metricsTracker.recordStepCompletion(currentStep.id, true);
        }
      } catch (error) {
        if (currentStep) {
          this.metricsTracker.recordStepCompletion(currentStep.id, false);
        }
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }

    return {
      success: true,
      context: this.context,
      metrics: this.metricsTracker.getMetrics()
    };
  }

  private async executeStep(step: WorkflowStep): Promise<unknown> {
    // Implementation would go here
    return {};
  }

  private async determineNextStep(
    currentStep: WorkflowStep,
    stepResult: unknown
  ): Promise<WorkflowStep | null> {
    if (currentStep.branches) {
      for (const branch of currentStep.branches) {
        if (typeof branch.condition === 'string') {
          // Handle simple condition strings - for now just evaluate as expressions
          const conditionObj: WorkflowCondition = {
            nextStepId: '',
            expression: branch.condition
          };
          if (await this.evaluateCondition(conditionObj, stepResult)) {
            return branch.nextStep;
          }
        } else if (await this.evaluateCondition(branch.condition, stepResult)) {
          return branch.nextStep;
        }
      }
    }
    return currentStep.next || null;
  }

  private async evaluateCondition(
    condition: WorkflowCondition,
    stepResult: unknown
  ): Promise<boolean> {
    // Handle expression-based conditions
    if (condition.expression) {
      return await this.evaluateExpression(condition.expression, stepResult);
    }
    
    // Legacy type-based conditions (if we had them)
    if ('type' in condition && 'value' in condition) {
      const typedCondition = condition as any;
      switch (typedCondition.type) {
        case 'equals':
          return stepResult === typedCondition.value;
        case 'contains':
          return String(stepResult).includes(String(typedCondition.value));
        case 'greater':
          return Number(stepResult) > Number(typedCondition.value);
        case 'less':
          return Number(stepResult) < Number(typedCondition.value);
        default:
          throw new Error(`Unknown condition type: ${typedCondition.type}`);
      }
    }
    
    return false;
  }

  private async evaluateExpression(
    expression: string,
    context: unknown
  ): Promise<boolean> {
    const sandbox = { context, result: false };
    const script = new Function('context', `
      try {
        with (context) {
          result = ${expression};
        }
        return result;
      } catch (error) {
        return false;
      }
    `);
    return script.call(sandbox, context);
  }
}