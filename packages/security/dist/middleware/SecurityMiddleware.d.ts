import { NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { SecurityService } from '../SecurityService.js';
import { SecurityMiddlewareConfig } from './types.js';
export declare class SecurityMiddleware implements NestMiddleware {
    private readonly securityService;
    private readonly config;
    constructor(securityService: SecurityService, config: SecurityMiddlewareConfig);
    use(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
    private extractToken;
    private getResourceFromRequest;
    private getActionFromRequest;
}
//# sourceMappingURL=SecurityMiddleware.d.ts.map