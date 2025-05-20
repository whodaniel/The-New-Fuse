import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggingService } from '../services/loggingService.js';
export declare class LoggingMiddleware implements NestMiddleware {
    private readonly logger;
    constructor(logger: LoggingService);
    use(req: Request, res: Response, next: NextFunction): void;
    private sanitizeHeaders;
}
