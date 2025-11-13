import { Request, Response, NextFunction } from 'express';
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
export declare function validateBody(schema: ValidationSchema): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.middleware.d.ts.map