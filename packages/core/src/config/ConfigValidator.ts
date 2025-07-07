import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'port';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

@Injectable()
export class ConfigValidator {
  private readonly logger = new Logger(ConfigValidator.name);

  validateConfig(config: Record<string, any>, rules: ValidationRule[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    for (const rule of rules) {
      const value = config[rule.field];
      const validationErrors = this.validateField(rule, value);

      for (const error of validationErrors) {
        if (rule.severity === 'error') {
          errors.push(error);
        } else {
          warnings.push(error);
        }
      }
    }

    const result = {
      valid: errors.length === 0,
      errors,
      warnings
    };

    if (errors.length > 0) {
      this.logger.error('Configuration validation failed', { errors });
    }

    if (warnings.length > 0) {
      this.logger.warn('Configuration validation warnings', { warnings });
    }

    return result;
  }

  private validateField(rule: ValidationRule, value: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check if required field is missing
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: rule.field,
        message: rule.message || `Field ${rule.field} is required`,
        code: 'required',
        severity: rule.severity
      });
      return errors;
    }

    // Skip validation if field is optional and empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return errors;
    }

    // Type validation
    if (!this.validateType(rule.type, value)) {
      errors.push({
        field: rule.field,
        message: rule.message || `Field ${rule.field} must be of type ${rule.type}`,
        code: 'invalid_type',
        severity: rule.severity
      });
      return errors;
    }

    // Additional validations based on type
    switch (rule.type) {
      case 'string':
        if (typeof value === 'string') {
          if (rule.min && value.length < rule.min) {
            errors.push({
              field: rule.field,
              message: `Field ${rule.field} must be at least ${rule.min} characters`,
              code: 'min_length',
              severity: rule.severity
            });
          }
          if (rule.max && value.length > rule.max) {
            errors.push({
              field: rule.field,
              message: `Field ${rule.field} must be at most ${rule.max} characters`,
              code: 'max_length',
              severity: rule.severity
            });
          }
          if (rule.pattern && !rule.pattern.test(value)) {
            errors.push({
              field: rule.field,
              message: rule.message || `Field ${rule.field} does not match required pattern`,
              code: 'pattern_mismatch',
              severity: rule.severity
            });
          }
        }
        break;

      case 'number':
        if (typeof value === 'number') {
          if (rule.min !== undefined && value < rule.min) {
            errors.push({
              field: rule.field,
              message: `Field ${rule.field} must be at least ${rule.min}`,
              code: 'min_value',
              severity: rule.severity
            });
          }
          if (rule.max !== undefined && value > rule.max) {
            errors.push({
              field: rule.field,
              message: `Field ${rule.field} must be at most ${rule.max}`,
              code: 'max_value',
              severity: rule.severity
            });
          }
        }
        break;

      case 'email':
        if (typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push({
              field: rule.field,
              message: `Field ${rule.field} must be a valid email address`,
              code: 'invalid_email',
              severity: rule.severity
            });
          }
        }
        break;

      case 'url':
        if (typeof value === 'string') {
          try {
            new URL(value);
          } catch {
            errors.push({
              field: rule.field,
              message: `Field ${rule.field} must be a valid URL`,
              code: 'invalid_url',
              severity: rule.severity
            });
          }
        }
        break;

      case 'port':
        if (typeof value === 'number') {
          if (value < 1 || value > 65535) {
            errors.push({
              field: rule.field,
              message: `Field ${rule.field} must be a valid port number (1-65535)`,
              code: 'invalid_port',
              severity: rule.severity
            });
          }
        }
        break;
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      errors.push({
        field: rule.field,
        message: rule.message || `Field ${rule.field} failed custom validation`,
        code: 'custom_validation',
        severity: rule.severity
      });
    }

    return errors;
  }

  private validateType(type: string, value: any): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'email':
      case 'url':
      case 'port':
        return typeof value === 'string' || typeof value === 'number';
      default:
        return true;
    }
  }

  createZodSchema(rules: ValidationRule[]): z.ZodObject<any> {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    try {
      for (const rule of rules) {
        let fieldSchema: z.ZodTypeAny;

        switch (rule.type) {
          case 'string':
          case 'email':
          case 'url':
            fieldSchema = z.string();
            if (rule.min) fieldSchema = (fieldSchema as z.ZodString).min(rule.min);
            if (rule.max) fieldSchema = (fieldSchema as z.ZodString).max(rule.max);
            if (rule.type === 'email') fieldSchema = (fieldSchema as z.ZodString).email();
            if (rule.type === 'url') fieldSchema = (fieldSchema as z.ZodString).url();
            break;
          case 'number':
          case 'port':
            fieldSchema = z.number();
            if (rule.min !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).min(rule.min);
            if (rule.max !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).max(rule.max);
            if (rule.type === 'port') {
              fieldSchema = (fieldSchema as z.ZodNumber).min(1).max(65535);
            }
            break;
          case 'boolean':
            fieldSchema = z.boolean();
            break;
          default:
            fieldSchema = z.any();
        }

        if (!rule.required) {
          fieldSchema = fieldSchema.optional();
        }

        schemaFields[rule.field] = fieldSchema;
      }

      return z.object(schemaFields);
    } catch (error) {
      this.logger.error('Error creating schema:', error);
      throw new Error('Failed to create validation schema');
    }
  }

  validateWithZod(config: Record<string, any>, schema: z.ZodObject<any>): ValidationResult {
    try {
      schema.parse(config);
      return {
        valid: true,
        errors: [],
        warnings: []
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          severity: 'error' as const
        }));

        return {
          valid: false,
          errors,
          warnings: []
        };
      }

      throw error;
    }
  }
}