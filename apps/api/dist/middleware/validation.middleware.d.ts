/**
 * Validation Middleware - Request validation using Joi
 */
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
interface ValidationSchema {
    body?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    headers?: Joi.ObjectSchema;
}
export declare function validateRequest(schema: ValidationSchema): (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=validation.middleware.d.ts.map