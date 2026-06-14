/**
 * Request logging middleware
 * Logs all incoming requests and their responses
 */
import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class RequestLoggerMiddleware implements NestMiddleware {
    private readonly logger;
    use(req: Request, res: Response, next: NextFunction): void;
}
//# sourceMappingURL=request-logger.middleware.d.ts.map