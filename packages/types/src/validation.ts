import type { JsonValue, ValidationResult } from './core/base-types.js';

export interface ValidationRule<T = unknown> {
  validate(value: T, context?: ValidationContext): Promise<ValidationResult<T>>;
  message?: string;
}

export interface ValidationSchema {
  type: string;
  rules: ValidationRule[];
  properties?: Record<string, ValidationSchema>;
  items?: ValidationSchema;
  nullable?: boolean;
  optional?: boolean;
  metadata?: Record<string, JsonValue>;
}

export interface ValidationContext {
  path: string[];
  value: unknown;
  parent?: unknown;
  root: unknown;
}

export interface ValidationError {
  path: string[];
  message: string;
  code?: string;
  metadata?: Record<string, JsonValue>;
}

export interface ValidationOptions {
  abortEarly?: boolean;
  stripUnknown?: boolean;
  context?: Record<string, unknown>;
}

export type { ValidationResult };
