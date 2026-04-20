import { Injectable } from '@nestjs/common';
import { WorkflowTemplate, WorkflowStep, WorkflowStepType } from '../types/types.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class WorkflowValidator {
  validateTemplate(template: WorkflowTemplate): ValidationResult {
    const errors: string[] = [];
    
    if (!template.id) {
      errors.push('Template ID is required');
    }

    if (!template.name) {
      errors.push('Template name is required');
    }

    if (!template.version) {
      errors.push('Template version is required');
    }

    if (!template.steps || template.steps.length === 0) {
      errors.push('Template must have at least one step');
    }

    // Validate each step
    for (const step of template.steps) {
      const stepValidation = this.validateStep(step);
      if (!stepValidation.valid) {
        errors.push(...stepValidation.errors);
      }
    }

    // Validate dependencies
    const dependencyValidation = this.validateDependencies(template.steps);
    if (!dependencyValidation.valid) {
      errors.push(...dependencyValidation.errors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateStep(step: WorkflowStep): ValidationResult {
    const errors: string[] = [];
    
    if (!step.id) {
      errors.push('Step ID is required');
    }

    if (!step.type) {
      errors.push(`Step ${step.id || 'unknown'} type is required`);
    }

    if (!step.config) {
      errors.push(`Step ${step.id || 'unknown'} of type ${step.type || 'unknown'} is missing required 'config'`);
    }

    // Validate step-specific requirements
    switch (step.type) {
      case WorkflowStepType.API_CALL:
        if (!step.config?.url) {
          errors.push(`API call step ${step.id || 'unknown'} is missing required 'url'`);
        }
        if (!step.config?.method) {
          errors.push(`API call step ${step.id || 'unknown'} is missing required 'method'`);
        }
        break;
      case WorkflowStepType.DATA_TRANSFORM:
        if (!step.config?.transform) {
          errors.push(`Data transform step ${step.id || 'unknown'} is missing required 'transform'`);
        }
        break;
      case WorkflowStepType.CONDITION:
        if (!step.config?.condition) {
          errors.push(`Condition step ${step.id || 'unknown'} is missing required 'condition'`);
        }
        break;
      case WorkflowStepType.LOOP:
        if (!step.config?.iterationPath) {
          errors.push(`Loop step ${step.id || 'unknown'} is missing required 'iterationPath'`);
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateDependencies(steps: WorkflowStep[]): ValidationResult {
    const stepIds = new Set(steps.map(step => step.id));
    const errors: string[] = [];
    
    for (const step of steps) {
      if (step.dependencies) {
        for (const depId of step.dependencies) {
          if (!stepIds.has(depId)) {
            errors.push(`Step ${step.id || 'unknown'} has invalid dependency ${depId}`);
          }
        }
      }
    }

    // Check for circular dependencies
    const graph = new Map<string, string[]>();
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    for (const step of steps) {
      graph.set(step.id, step.dependencies || []);
    }

    const hasCycle = (node: string): boolean => {
      if (recursionStack.has(node)) return true;
      if (visited.has(node)) return false;
      
      visited.add(node);
      recursionStack.add(node);
      
      for (const neighbor of graph.get(node) || []) {
        if (hasCycle(neighbor)) return true;
      }

      recursionStack.delete(node);
      return false;
    };

    for (const step of steps) {
      if (hasCycle(step.id)) {
        errors.push(`Circular dependency detected involving step ${step.id || 'unknown'}`);
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}