/**
 * Template Validator for The New Fuse Workflow System
 * Validates workflow templates for correctness and completeness
 */

import { Injectable, Logger } from '@nestjs/common';
import { WorkflowTemplate, WorkflowStep, WorkflowStepType } from './types';
import { WorkflowError } from './types';

@Injectable()
export class TemplateValidator {
  private readonly logger = new Logger(TemplateValidator.name);

  validateTemplate(template: WorkflowTemplate): void {
    if (!template) {
      throw new WorkflowError('Template is required');
    }
    
    if (!template.id) {
      throw new WorkflowError('Template ID is required');
    }
    
    if (!template.name) {
      throw new WorkflowError('Template name is required');
    }
    
    if (!Array.isArray(template.steps)) {
      throw new WorkflowError('Template must have a steps array');
    }
    
    this.logger.log(`Template '${template.name}' validation started`);
    
    for (const step of template.steps) {
      this.validateStep(step);
    }
    
    this.validateDependencies(template.steps);
  }
  
  private validateStep(step: WorkflowStep): void {
    if (!step.id) {
      throw new WorkflowError('Step ID is required');
    }
    
    if (!step.name) {
      throw new WorkflowError(`Step '${step.id}' is missing required 'name'`);
    }
    
    if (!step.type) {
      throw new WorkflowError(`Step '${step.id}' is missing required 'type'`);
    }
    
    this.validateStepType(step);
  }
  
  private validateStepType(step: WorkflowStep): void {
    const validTypes = Object.values(WorkflowStepType);
    if (!validTypes.includes(step.type)) {
      this.logger.debug(`Validated generic step type '${step.type}' for step '${step.id}'`);
    } else {
      throw new WorkflowError(`Unknown or unsupported step type '${step.type}'`);
    }
  }
  
  private validateDependencies(steps: WorkflowStep[]): void {
    const stepIds = new Set(steps.map(s => s.id));
    
    for (const step of steps) {
      if (step.dependencies) {
        for (const depId of step.dependencies) {
          if (!stepIds.has(depId)) {
            throw new WorkflowError(`Step '${step.id}' has invalid dependency '${depId}'`);
          }
        }
      }
    }
  }
}