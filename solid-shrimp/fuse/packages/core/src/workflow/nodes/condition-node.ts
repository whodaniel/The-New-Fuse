export interface ConditionConfig {
  condition: string;
  trueBranch?: string;
  falseBranch?: string;
}

export interface WorkflowStep {
  id: string;
  config: any;
}

export interface WorkflowContext {
  variables: Record<string, any>;
  stepResults: Record<string, any>;
}

export class ConditionNode {
  async execute(config: ConditionConfig, context: WorkflowContext): Promise<{ nextStep?: string; result: boolean }> {
    if (!config.condition) {
      throw new Error('Condition is required');
    }

    try {
      // Simple condition evaluation (in production, use a proper expression evaluator)
      const result = this.evaluateCondition(config.condition, context);
      const nextStep = result ? config.trueBranch : config.falseBranch;
      return {
        nextStep,
        result
      };
    } catch (error) {
      throw new Error(`Condition evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private evaluateCondition(condition: string, context: WorkflowContext): boolean {
    // Basic condition evaluation - in production, use a proper expression evaluator
    try {
      // Replace variables in condition with actual values
      let evaluatedCondition = condition;
      Object.entries(context.variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        evaluatedCondition = evaluatedCondition.replace(regex, JSON.stringify(value));
      });

      // For safety, only allow basic comparisons
      if (/^[\d\s<>=!&|()]+$/.test(evaluatedCondition)) {
        return eval(evaluatedCondition);
      } else {
        throw new Error('Invalid condition syntax');
      }
    } catch (error) {
      throw new Error(`Failed to evaluate condition: ${condition}`);
    }
  }
}
