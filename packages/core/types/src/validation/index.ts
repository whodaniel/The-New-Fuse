// Validation types and classes for The New Fuse framework

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  code: string;
  message: string;
  metadata?: any;
}

export interface ValidationOptions {
  strict?: boolean;
  throwOnError?: boolean;
}

export abstract class BaseValidator {
  abstract type: string;
  
  async validate(value: any, options?: ValidationOptions): Promise<ValidationResult> {
    try {
      // Base validation logic - should be overridden by subclasses
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown validation error',
        }]
      };
    }
  }
}

export class ValidatorRegistry {
  private validators = new Map<string, BaseValidator>();

  register(type: string, validator: BaseValidator): void {
    this.validators.set(type, validator);
  }

  unregister(type: string): void {
    this.validators.delete(type);
  }

  get(type: string): BaseValidator | undefined {
    return this.validators.get(type);
  }

  getAll(): Map<string, BaseValidator> {
    return new Map(this.validators);
  }

  clear(): void {
    this.validators.clear();
  }
}

// HTTP Node Validator
export class HttpConfigValidator extends BaseValidator {
  type = 'http';

  async validate(value: any, options?: ValidationOptions): Promise<ValidationResult> {
    try {
      // HTTP-specific validation logic
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          code: 'HTTP_VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'HTTP validation error',
        }]
      };
    }
  }
}

// Transform Node Validator
export class TransformConfigValidator extends BaseValidator {
  type = 'transform';

  async validate(value: any, options?: ValidationOptions): Promise<ValidationResult> {
    try {
      // Transform-specific validation logic
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          code: 'TRANSFORM_VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Transform validation error',
        }]
      };
    }
  }
}

// Condition Node Validator
export class ConditionConfigValidator extends BaseValidator {
  type = 'condition';

  async validate(value: any, options?: ValidationOptions): Promise<ValidationResult> {
    try {
      // Condition-specific validation logic
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          code: 'CONDITION_VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Condition validation error',
        }]
      };
    }
  }
}

// Registry Node Validator
export class RegistryConfigValidator extends BaseValidator {
  type = 'registry';

  async validate(value: any, options?: ValidationOptions): Promise<ValidationResult> {
    try {
      // Registry-specific validation logic
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          code: 'REGISTRY_VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Registry validation error',
        }]
      };
    }
  }
}

// Create and export validator instance
export const configValidator = new ValidatorRegistry();
configValidator.register('http', new HttpConfigValidator());
configValidator.register('transform', new TransformConfigValidator());
configValidator.register('condition', new ConditionConfigValidator());
configValidator.register('registry', new RegistryConfigValidator());