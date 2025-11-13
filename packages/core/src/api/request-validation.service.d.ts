import { LoggingService } from '../services/LoggingService';
import { ConfigService } from '../config/ConfigService';
export interface ValidationRule {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'email' | 'url' | 'uuid';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean;
    message?: string;
}
export interface ValidationSchema {
    [key: string]: ValidationRule | ValidationRule[];
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    sanitizedData?: Record<string, any>;
}
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
    rule?: string;
}
export interface SanitizationOptions {
    trim?: boolean;
    lowerCase?: boolean;
    upperCase?: boolean;
    escape?: boolean;
    stripTags?: boolean;
}
export declare class RequestValidationService {
    private readonly logger;
    private readonly configService;
    private validationRules;
    constructor(logger: LoggingService, configService: ConfigService);
    private initializeDefaultRules;
    removeSchema(name: string): void;
    getSchema(name: string): ValidationSchema | undefined;
    validate(data: Record<string, any>, schema: ValidationSchema | string): ValidationResult;
    if(rule: any, maxLength: any): any;
}
export default RequestValidationService;
//# sourceMappingURL=request-validation.service.d.ts.map