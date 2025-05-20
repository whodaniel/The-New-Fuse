import { JsonValue, ValidationResult } from './common-types.js';
export interface ValidationRule {
    id: string;
    name: string;
    description?: string;
    type: 'schema' | 'custom' | 'regex' | 'function';
    target: string;
    condition: ValidationCondition;
    message: string;
    severity: 'error' | 'warning' | 'info';
    metadata?: Record<string, JsonValue>;
}
export interface ValidationCondition {
    type: string;
    params: Record<string, JsonValue>;
    options?: Record<string, JsonValue>;
}
export interface ValidationContext {
    path: string;
    value: unknown;
    parent?: unknown;
    root: unknown;
    metadata?: Record<string, JsonValue>;
}
export interface ValidationError {
    rule: string;
    message: string;
    path: string;
    value?: unknown;
    metadata?: Record<string, JsonValue>;
}
export interface ValidationWarning extends Omit<ValidationError, 'rule'> {
    rule: string;
}
export interface ValidationInfo extends Omit<ValidationError, 'rule'> {
    rule: string;
}
export interface ValidationOptions {
    stopOnFirstError?: boolean;
    validateAllRules?: boolean;
    includeWarnings?: boolean;
    includeInfo?: boolean;
    context?: Record<string, JsonValue>;
}
export interface ValidationSchema {
    id: string;
    name: string;
    version: string;
    rules: ValidationRule[];
    options?: ValidationOptions;
    metadata?: Record<string, JsonValue>;
}
export type ValidationFunction = (value: unknown, params?: Record<string, unknown>) => boolean;
export interface Validator<T> {
    validate: (value: unknown) => ValidationResult<T>;
    addRule(name: string, fn: ValidationFunction): void;
    removeRule(name: string): void;
    transform?: (value: JsonValue) => T;
}
//# sourceMappingURL=validation.d.d.ts.map