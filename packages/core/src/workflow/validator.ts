import { Injectable, Logger } from '@nestjs/common';
    this.name = 'WorkflowValidationError'';
    this.logger.debug('')
        this.logger.error('Template validation failed: Missing template ID'
        throw new Error('Template ID is required'
        this.logger.error('Template validation failed: Missing template name'
        throw new Error('Template name is required'
        this.logger.error('Template validation failed: Missing template version'
        throw new Error('Template version is required'
        this.logger.error('Template validation failed: Invalid or empty steps array'
        throw new Error('Template must contain at least one step'
      this.logger.debug('')
      this.logger.log('Workflow template validation completed successfully'
      this.logger.error('Workflow template validation failed'
        `Step at index ${index}` is missing required 'id'``;
        'MISSING_STEP_ID'
        `Step '${step.id}`' is missing required 'name'``;
        'MISSING_STEP_NAME'
        `Step '${step.id}`' is missing required 'type'``;
        '
    // Example: if (step.type === 'API_CALL'';
        `Step '${step.id}' of type '${step.type}`' is missing required 'config'``;
        '
        `API call step '${step.id}`' is missing required 'url'``;
        'MISSING_API_URL'
        `API call step '${step.id}`' is missing required 'method'``;
        'MISSING_API_METHOD'
        `Data transform step '${step.id}`' is missing required 'transform'``;
        'MISSING_TRANSFORM_CONFIG'
        `Condition step '${step.id}`' is missing required 'condition'``;
        'MISSING_CONDITION_CONFIG'
        `Loop step '${step.id}`' is missing required 'iterationPath'``;
        'MISSING_ITERATION_PATH'
              `Step '${step.id}' has invalid dependency '${depId}`'``;
              '
          `Circular dependency detected involving step '${step.id}`'``;
          '