import { Injectable } from '@nestjs/common';
import { 
  WorkflowTemplate, 
  WorkflowStep, 
  WorkflowError,
  WorkflowDefinition
} from '@the-new-fuse/types';

@Injectable()
export class TemplateValidator {
  private rules: unknown[] = [];

  validate(template: WorkflowTemplate): void {
    this.validateTemplate(template);
  }

  private validateTemplate(template: WorkflowTemplate): void {
    this.validateBasicFields(template);
    this.validateSteps(template.steps);
    this.validateDependencies(template);
    this.validateNoCycles(template);
  }

  private validateBasicFields(template: WorkflowTemplate): void {
    if (!template.id) {
      throw new WorkflowError('Template ID is required', 'INVALID_TEMPLATE', template.id);
    }
    if (!template.name) {
      throw new WorkflowError('Template name is required', 'INVALID_TEMPLATE', template.id);
    }
    if (!template.steps || !Array.isArray(template.steps) || template.steps.length === 0) {
      throw new WorkflowError('Template must have at least one step', 'INVALID_TEMPLATE', template.id);
    }
  }

  private validateSteps(steps: WorkflowStep[]): void {
    const stepNames = new Set<string>(steps.map(s => s.name));
    
    steps.forEach((step: WorkflowStep) => {
      if (!step.name || typeof step.name !== 'string') {
        throw new WorkflowError('Step name is required and must be a string', 'INVALID_STEP', step.id);
      }
      
      if (step.dependencies) {
        step.dependencies.forEach((dep: string) => {
          if (!stepNames.has(dep)) {
            throw new WorkflowError(`Dependency ${dep} not found`, 'INVALID_DEPENDENCY', step.id);
          }
        });
      }
    });
  }

  private validateDependencies(template: WorkflowTemplate): void {
    const stepMap = new Map(template.steps.map(step => [step.id, step]));

    template.steps.forEach((step) => {
      if (step.dependencies) {
        step.dependencies.forEach((depId: string) => {
          if (!stepMap.has(depId)) {
            throw new WorkflowError(
              `Step ${step.id} has invalid dependency ${depId}`,
              'INVALID_DEPENDENCY',
              template.id
            );
          }
        });
      }
    });
  }

  private validateNoCycles(template: WorkflowTemplate): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepId: string, steps: Map<string, WorkflowStep>): boolean => {
      if (recursionStack.has(stepId)) {
        return true;
      }
      if (visited.has(stepId)) {
        return false;
      }

      visited.add(stepId);
      recursionStack.add(stepId);

      const step = steps.get(stepId);
      if (step && step.dependencies) {
        for(const depId of step.dependencies) {
          if (hasCycle(depId, steps)) {
            return true;
          }
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    const stepMap = new Map(template.steps.map(step => [step.id, step]));

    template.steps.forEach((step) => {
      if (hasCycle(step.id, stepMap)) {
        throw new WorkflowError(
          `Cyclic dependency detected in step ${step.id}`,
          'CYCLIC_DEPENDENCY',
          template.id
        );
      }
    });
  }
}
