export type ValidationRule = (value: any) => boolean | string;
export interface ValidationOptions {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    email?: boolean;
    url?: boolean;
    min?: number;
    max?: number;
    custom?: ValidationRule;
}
export declare function validateRequired(value: any): boolean | string;
export declare function validateEmail(email: string): boolean | string;
export declare function validateUrl(url: string): boolean | string;
export declare function validateMinLength(value: string, min: number): boolean | string;
export declare function validateMaxLength(value: string, max: number): boolean | string;
export declare function validatePattern(value: string, pattern: RegExp): boolean | string;
export declare function validateMin(value: number, min: number): boolean | string;
export declare function validateMax(value: number, max: number): boolean | string;
export declare function hasErrors(errors: Record<string, string[]>): boolean;
export declare function getFirstError(fieldErrors: string[]): string;
export interface ValidationRule<T> {
    validate: (value: T) => boolean;
    message: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
export declare const required: (message?: string) => ValidationRule<any>;
export declare const minLength: (min: number, message?: string) => ValidationRule<string>;
export declare const maxLength: (max: number, message?: string) => ValidationRule<string>;
export declare const email: (message?: string) => ValidationRule<string>;
export declare const url: (message?: string) => ValidationRule<string>;
export declare const numeric: (message?: string) => ValidationRule<string>;
export declare const integer: (message?: string) => ValidationRule<string | number>;
export declare const min: (min: number, message?: string) => ValidationRule<number>;
export declare const max: (max: number, message?: string) => ValidationRule<number>;
export declare const pattern: (regex: RegExp, message: string) => ValidationRule<string>;
export declare const matchValue: (matchTo: any, message?: string) => ValidationRule<any>;
export interface FormValidationRule<T> {
    field: keyof T;
    rules: ValidationRule<any>[];
}
export interface FormValidationResult<T> {
    isValid: boolean;
    errors: Partial<Record<keyof T, string[]>>;
}
export interface AsyncValidationRule<T> {
    validate: (value: T) => Promise<boolean>;
    message: string;
}
export declare function validateAsync<T>(value: T, rules: AsyncValidationRule<T>[]): Promise<ValidationResult>;
