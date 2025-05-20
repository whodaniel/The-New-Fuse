import { WorkflowStep, ValidationResult, ValidationError } from '../types.js';

export class WorkflowValidator {
  validate(steps: WorkflowStep[]): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Check for basic requirements
    if (!steps.length) {
      errors.push({
        type: "error",
        message: "Workflow must contain at least one step"
      });
      return { valid: false, errors };
    }

    // Validate individual steps
    steps.forEach(step: WorkflowStep => {
      const stepErrors = this.validateStep(step);
      errors.push(...stepErrors);
    });

    // Validate workflow structure
    const structureErrors = this.validateWorkflowStructure(steps);
    errors.push(...structureErrors);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateStep(step: WorkflowStep): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate required fields
    if (!step.id) {
      errors.push({
        type: "error",
        message: "Step ID is required",
        step: step
      });
    }

    // Check for name in metadata if name property doesn't exist directly
    if (!step.name && !step.metadata?.name) {
      errors.push({
        type: "error",
        message: "Step name is required (either directly or in metadata)",
        step: step
      });
    }

    // Validate action configuration (either action or type should be meaningful)
    if (!step.action && step.type === 'default') {
      errors.push({
        type: "error",
        message: "Step action or specific type is required",
        step: step
      });
    }

    // Check for conditions in metadata
    if (step.metadata?.conditions) {
      const conditionErrors = this.validateConditions(step.metadata.conditions as any[]);
      errors.push(...conditionErrors);
    }

    return errors;
  }

  private validateAction(action: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!action.type) {
      errors.push({
        type: "error",
        message: "Action type is required"
      });
    }

    if (action.type === 'api' && !action.endpoint) {
      errors.push({
        type: "error",
        message: "API endpoint is required for API actions"
      });
    }

    if (action.type === 'function' && !action.handler) {
      errors.push({
        type: "error",
        message: "Function handler is required for function actions"
      });
    }

    return errors;
  }

  private validateConditions(conditions: any[]): ValidationError[] {
    const errors: ValidationError[] = [];

    conditions.forEach(condition => {
      if (!condition.type) {
        errors.push({
          type: "error",
          message: "Condition type is required"
        });
      }

      if (!condition.value && condition.type !== 'expression') {
        errors.push({
          type: "error",
          message: "Condition value is required"
        });
      }

      if (condition.type === 'expression' && !condition.expression) {
        errors.push({
          type: "error",
          message: "Expression is required for expression conditions"
        });
      }
    });

    return errors;
  }

  private validateWorkflowStructure(steps: WorkflowStep[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const stepIds = new Set(steps.map(s: WorkflowStep) => s.id));

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const checkCircular = (stepId: string): boolean => {
      if (!visited.has(stepId)) {
        visited.add(stepId);
        recursionStack.add(stepId);

        const step = steps.find(s: WorkflowStep) => s.id === stepId);
        const dependencies = step?.metadata?.dependencies || [];

        for (const depId of dependencies) {
          if (!visited.has(depId) && checkCircular(depId)) {
            errors.push({
              type: "error",
              message: `Circular dependency detected involving step ${stepId}`
            });
            return true;
          } else if (recursionStack.has(depId)) {
            errors.push({
              type: "error",
              message: `Circular dependency detected involving step ${stepId}`
            });
            return true;
          }
        }
      }
      recursionStack.delete(stepId);
      return false;
    };

    steps.forEach(step: WorkflowStep => {
      const deps = step.metadata?.dependencies || [];
      if (deps.length) {
        // Check for invalid dependencies
        deps.forEach((depId: string) => {
          if (!stepIds.has(depId)) {
            errors.push({
              type: "error",
              message: `Step ${step.id} has invalid dependency: ${depId}`,
              step: step
            });
          }
        });
        // Check for circular dependencies
        checkCircular(step.id);
      }
    });

    return errors;
  }
}