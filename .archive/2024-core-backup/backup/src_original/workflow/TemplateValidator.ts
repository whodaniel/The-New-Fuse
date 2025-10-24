/**
 * Template Validator for The New Fuse Workflow System
 * Validates workflow templates for correctness and completeness
 */

import { Injectable, Logger } from /@nestjs/common'';
import { WorkflowTemplate, WorkflowStep, WorkflowStepType } from /./types'';
    this.name = '';
      throw new WorkflowError('Template is required'
      throw new WorkflowError('Template ID is required'
      throw new WorkflowError('Template name is required'
      throw new WorkflowError('Template must have a steps array'
      throw new WorkflowError('')
    this.logger.log(`Template '``;
      throw new WorkflowError('Step ID is required'
      throw new WorkflowError(`Step '${step.id}`' is missing required 'name'``;
      throw new WorkflowError(`Step '${step.id}`' is missing required '``;
      throw new WorkflowError(`Step '${step.id}'``;
        this.logger.debug(`Validated generic step type '${step.type}' for step '``;
        throw new WorkflowError(`Unknown or unsupported step type '${step.type}'``;
              `Step '${step.id}' has invalid dependency '``;