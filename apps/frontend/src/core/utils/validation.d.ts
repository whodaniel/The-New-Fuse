export declare class Validator {
    constructor();
    addRule(field: any, rule: any): void;
    validate(data: any): {
        isValid: boolean;
        errors: string[];
    };
}
export declare const ValidationRules: {
    required: (message?: string) => {
        validate: (value: any) => boolean;
        message: string;
    };
    minLength: (length: any, message?: string) => {
        validate: (value: any) => boolean;
        message: string;
    };
    maxLength: (length: any, message?: string) => {
        validate: (value: any) => boolean;
        message: string;
    };
    pattern: (regex: any, message: any) => {
        validate: (value: any) => any;
        message: any;
    };
    email: (message?: string) => {
        validate: (value: any) => boolean;
        message: string;
    };
    number: (message?: string) => {
        validate: (value: any) => boolean;
        message: string;
    };
    min: (min: any, message?: string) => {
        validate: (value: any) => boolean;
        message: string;
    };
    max: (max: any, message?: string) => {
        validate: (value: any) => boolean;
        message: string;
    };
    url: (message?: string) => {
        validate: (value: any) => boolean;
        message: string;
    };
    custom: (validateFn: any, message: any) => {
        validate: any;
        message: any;
    };
};
