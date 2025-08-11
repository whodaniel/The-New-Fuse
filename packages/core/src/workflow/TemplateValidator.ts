/**
 * Template Validator for The New Fuse Workflow System
 * Validates workflow templates for correctness and completeness
 */

import { Injectable, Logger } from '@nestjs/common';
import { WorkflowTemplate, WorkflowStep, WorkflowStepType } from './types';
import { WorkflowError } from './types';
@Injectable()
export class TemplateValidator {
  // Implementation needed
}
  private readonly logger = new Logger(TemplateValidator.name);
  validateTemplate(template: WorkflowTemplate): void {
  // Implementation needed
}
    if (!template) {
  // Implementation needed
}
      throw new WorkflowError('Template is required');
    }
    
    if (!template.id) {
  // Implementation needed
}
      throw new WorkflowError('Template ID is required');
    }
    
    if (!template.name) {
  // Implementation needed
}
      throw new WorkflowError('Template name is required');
    }
    
    if (!Array.isArray(template.steps)) {
  // Implementation needed
}
      throw new WorkflowError('Template must have a steps array');
    }
    
    this.logger.log(`Template `${placeholder}` validation started`);
    for (const step of template.steps) {
  // Implementation needed
}
      this.validateStep(step);
    }
    
    this.validateDependencies(template.steps);
  }
  
  private validateStep(step: WorkflowStep): void {
  // Implementation needed
}
    if (!step.id) {
  // Implementation needed
}
      throw new WorkflowError('Step ID is required');
    }
    
    if (!step.name) {
  // Implementation needed
}
      throw new WorkflowError(`Step `${placeholder}` is missing required 'name'`);
    }
    
    if (!step.type) {
  // Implementation needed
}
      throw new WorkflowError(`Step `${placeholder}` is missing required 'type'`);
    }
    
    this.validateStepType(step);
  }
  
  private validateStepType(step: WorkflowStep): void {
  // Implementation needed
}
    const validTypes = Object.values(WorkflowStepType);
    if (!validTypes.includes(step.type)) {
  // Implementation needed
}
      this.logger.debug(`Validated generic step type `${placeholder}` for step `${placeholder}``);
    } else {
  // Implementation needed
}
      throw new WorkflowError(`Unknown or unsupported step type `${placeholder}``);
    }
  }
  
  private validateDependencies(steps: WorkflowStep[]): void {
  // Implementation needed
}
    const stepIds = new Set(steps.map(s => s.id));
    for (const step of steps) {
  // Implementation needed
}
      if (step.dependencies) {
  // Implementation needed
}
        for (const depId of step.dependencies) {
  // Implementation needed
}
          if (!stepIds.has(depId)) {
  // Implementation needed
}
            throw new WorkflowError(`Step `${placeholder}` has invalid dependency `${placeholder}``);
          }
        }
      }
    }
  }
}