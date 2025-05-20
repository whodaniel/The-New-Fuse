import { Injectable } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { z } from 'zod';

interface ValidationResult {
  valid: boolean;
  errors?: z.ZodError[];
  warnings?: string[];
}

interface ValidationRule {
  schema: z.ZodSchema;
  message?: string;
  severity: 'error' | 'warning';
  condition?: (value: unknown) => boolean;
}

@Injectable()
export class ConfigValidator {
  private logger: Logger;
  private rules: Map<string, ValidationRule[]>;
  private customValidators: Map<string, (value: unknown) => Promise<ValidationResult>>;

  constructor() {
    this.logger = new Logger('ConfigValidator');
    this.rules = new Map<string, ValidationRule[]>();
    this.customValidators = new Map<string, (value: unknown) => Promise<ValidationResult>>();
  }

  addRule(path: string, rule: ValidationRule): void {
    const rules = this.rules.get(path) || [];
    rules.push(rule);
    this.rules.set(path, rules);
  }

  addCustomValidator(path: string, validator: (value: unknown) => Promise<ValidationResult>): void {
    this.customValidators.set(path, validator);
  }

  async validate(path: string, value: unknown): Promise<ValidationResult> {
    try {
      const errors: z.ZodError[] = [];
      const warnings: string[] = [];

      // Check schema rules
      const rules = this.rules.get(path) || [];
      for (const rule of rules) {
        try {
          // Check condition if present
          if (rule.condition && !rule.condition(value)) {
            continue;
          }

          // Validate against schema
          rule.schema.parse(value);
        } catch (error) {
          if (error instanceof z.ZodError) {
            if(rule.severity === 'error') {
              errors.push(error);
            } else {
              warnings.push(rule.message || error.message);
            }
          }
        }
      }

      // Run custom validator if present
      const customValidator = this.customValidators.get(path);
      if (customValidator) {
        const customResult = await customValidator(value);
        if (customResult.errors) {
          errors.push(...customResult.errors);
        }
        if (customResult.warnings) {
          warnings.push(...customResult.warnings);
        }
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error: any) {
      this.logger.error(`Validation failed for ${path}:`, error);
      throw error;
    }
  }

  async createSchema(config: Record<string, unknown>): Promise<z.ZodSchema> {
    try {
      const schemaObject: Record<string, z.ZodSchema> = {};

      for (const [key, value] of Object.entries(config)) {
        if(typeof value === 'object' && value !== null) {
          schemaObject[key] = this.createSchema(value as Record<string, unknown>);
        } else {
          schemaObject[key] = this.inferSchema(value);
        }
      }

      return z.object(schemaObject);
    } catch (error) {
      this.logger.error('Error creating schema:', error);
      throw error;
    }
  }

  inferSchema(value: unknown): z.ZodSchema {
    switch (typeof value) {
      case 'string':
        return z.string();
      case 'number':
        return z.number();
      case 'boolean':
        return z.boolean();
      case 'object':
        if(value === null) {
          return z.null();
        }
        if (Array.isArray(value)) {
          return z.array(this.inferSchema(value[0] || null));
        }
        return z.object({});
      default:
        return z.any();
    }
  }

  validateEnvironmentVariables(
    requiredVars: string[],
    optionalVars: string[] = []
  ): ValidationResult {
    const errors: z.ZodError[] = [];
    const warnings: string[] = [];

    // Check required variables
    for (const variable of requiredVars) {
      if (process.env[variable] === undefined) {
        errors.push(
          new z.ZodError([
            {
              code: 'custom',
              path: [variable],
              message: `Required environment variable ${variable} is missing`
            }
          ])
        );
      }
    }

    // Check optional variables
    for (const variable of optionalVars) {
      if (process.env[variable] === undefined) {
        warnings.push(`Optional environment variable ${variable} is not set`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  validateDependencies(
    config: Record<string, unknown>,
    dependencies: Record<string, string[]>
  ): ValidationResult {
    const errors: z.ZodError[] = [];
    const warnings: string[] = [];

    for (const [key, deps] of Object.entries(dependencies)) {
      if(config[key] !== undefined) {
        for (const dep of deps) {
          if(config[dep] === undefined) {
            errors.push(
              new z.ZodError([
                {
                  code: 'custom',
                  path: [key],
                  message: `Configuration ${key} requires ${dep} to be set`
                }
              ])
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  validateConstraints(
    config: Record<string, unknown>,
    constraints: Record<string, (value: unknown) => boolean>
  ): ValidationResult {
    const errors: z.ZodError[] = [];

    for (const [key, constraint] of Object.entries(constraints)) {
      if(config[key] !== undefined) {
        try {
          if (!constraint(config[key])) {
            errors.push(
              new z.ZodError([
                {
                  code: 'custom',
                  path: [key],
                  message: `Configuration ${key} failed constraint validation`
                }
              ])
            );
          }
        } catch (error: any) {
          errors.push(
            new z.ZodError([
              {
                code: 'custom',
                path: [key],
                message: `Error validating constraint for ${key}: ${(error as Error).message}`
              }
            ])
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
