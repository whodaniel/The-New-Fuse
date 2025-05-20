import { ValidatorOptions, ValidationError } from 'class-validator';
import { LoggingService } from './loggingService.js';
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
export interface ValidationConfig extends ValidatorOptions {
    enableDebugLogs?: boolean;
}
export declare class ValidationService {
    private readonly logger;
    private readonly defaultConfig;
    constructor(logger: LoggingService);
    validateRequest<T extends object>(data: any, dto: new () => T, config?: Partial<ValidationConfig>): Promise<ValidationResult>;
    private formatValidationErrors;
    validateSync<T extends object>(data: any, dto: new () => T, config?: Partial<ValidationConfig>): ValidationResult;
    validateValue(value: any, rules: {
        [key: string]: (value: any) => boolean | Promise<boolean>;
    }): Promise<boolean>;
    validateSchema(data: any, schema: object): boolean;
    private validateObject;
}
