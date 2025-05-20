import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ValidationService } from '../services/validationService.js';
import { LoggingService } from '../services/loggingService.js';
export interface ValidationOptions {
    dto?: new () => any;
    schema?: object;
    rules?: {
        [key: string]: (value: any) => boolean | Promise<boolean>;
    };
    validateQuery?: boolean;
    validateBody?: boolean;
    validateParams?: boolean;
}
export declare class ValidationMiddleware implements NestMiddleware {
    private readonly validationService;
    private readonly logger;
    constructor(validationService: ValidationService, logger: LoggingService);
    use(options: ValidationOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
