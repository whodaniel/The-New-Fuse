import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SecurityService } from '../SecurityService';
import { SecurityMiddlewareConfig } from './types';
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