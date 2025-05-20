export interface ValidationRule<T = any> {
    validate: (value: T) => boolean;
    message: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
export declare class Validator {
    private rules;
    addRule<T>(field: string, rule: ValidationRule<T>): void;
    validate<T extends Record<string, any>>(data: T): ValidationResult;
}
export declare const ValidationRules: {
    required: (message?: string) => ValidationRule;
    minLength: (length: number, message?: string) => ValidationRule<string>;
    maxLength: (length: number, message?: string) => ValidationRule<string>;
    pattern: (regex: RegExp, message: string) => ValidationRule<string>;
    email: (message?: string) => ValidationRule<string>;
    number: (message?: string) => ValidationRule;
    min: (min: number, message?: string) => ValidationRule<number>;
    max: (max: number, message?: string) => ValidationRule<number>;
    url: (message?: string) => ValidationRule<string>;
    custom: <T>(validateFn: (value: T) => boolean, message: string) => ValidationRule<T>;
};
