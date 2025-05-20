import { z } from 'zod';

export interface ValidationResult {
    valid: boolean;
    errors?: z.ZodError<any>[]; // This should be z.ZodError<any>[] or z.ZodError<z.ZodTypeAny>[] if you want to be more precise
    warnings?: string[];
}

export interface ValidationRule {
    schema: z.ZodTypeAny;
    message?: string;
    severity: 'error' | 'warning';
    condition?: (value: unknown) => boolean;
}

export declare class ConfigValidator {
    private logger;
    private rules;
    private customValidators;
    constructor();
    addRule(path: string, rule: ValidationRule): void;
    addCustomValidator(path: string, validator: (value: unknown) => Promise<ValidationResult>): void;
    validate(): Promise<void>;
}
