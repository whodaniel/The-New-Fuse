import { Request, Response, NextFunction } from 'express';
import { ApiError } from './error.middleware.js';

/**
 * Validation schema interface
 */
export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    validate?: (value: any) => boolean | string;
  };
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate request body against a schema
 */
export function validateBody(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: ValidationError[] = [];

    // Check each field in the schema
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      // Check required fields
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }

      // Skip validation for undefined optional fields
      if (value === undefined) {
        continue;
      }

      // Type validation
      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push({ field, message: `${field} must be a ${rules.type}` });
          continue;
        }
      }

      // String validations
      if (rules.type === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push({ field, message: `${field} must be at least ${rules.minLength} characters` });
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push({ field, message: `${field} must be at most ${rules.maxLength} characters` });
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push({ field, message: `${field} has an invalid format` });
        }
      }

      // Number validations
      if (rules.type === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push({ field, message: `${field} must be at least ${rules.min}` });
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push({ field, message: `${field} must be at most ${rules.max}` });
        }
      }

      // Enum validations
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({ field, message: `${field} must be one of: ${rules.enum.join(', ')}` });
      }

      // Custom validation
      if (rules.validate) {
        const result = rules.validate(value);
        if (result !== true) {
          const message = typeof result === 'string' ? result : `${field} is invalid`;
          errors.push({ field, message });
        }
      }
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return next(new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors));
    }

    next();
  };
}

/**
 * Validate request params against a schema
 */
export function validateParams(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: ValidationError[] = [];

    // Check each field in the schema
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.params[field];

      // Check required fields
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }

      // Skip validation for undefined optional fields
      if (value === undefined) {
        continue;
      }

      // Type validation for params is limited since they're always strings
      if (rules.type && rules.type !== 'string') {
        // Convert string to the expected type
        if (rules.type === 'number') {
          const num = Number(value);
          if (isNaN(num)) {
            errors.push({ field, message: `${field} must be a number` });
            continue;
          }
          
          // Number validations
          if (rules.min !== undefined && num < rules.min) {
            errors.push({ field, message: `${field} must be at least ${rules.min}` });
          }
          if (rules.max !== undefined && num > rules.max) {
            errors.push({ field, message: `${field} must be at most ${rules.max}` });
          }
        }
      } else {
        // String validations
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push({ field, message: `${field} must be at least ${rules.minLength} characters` });
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push({ field, message: `${field} must be at most ${rules.maxLength} characters` });
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push({ field, message: `${field} has an invalid format` });
        }
      }

      // Enum validations
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({ field, message: `${field} must be one of: ${rules.enum.join(', ')}` });
      }

      // Custom validation
      if (rules.validate) {
        const result = rules.validate(value);
        if (result !== true) {
          const message = typeof result === 'string' ? result : `${field} is invalid`;
          errors.push({ field, message });
        }
      }
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return next(new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors));
    }

    next();
  };
}
