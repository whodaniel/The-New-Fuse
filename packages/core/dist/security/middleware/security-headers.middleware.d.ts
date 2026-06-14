import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class SecurityHeadersMiddleware implements NestMiddleware {
    private readonly helmetMiddleware;
    constructor();
    use(req: Request, res: Response, next: NextFunction): void;
}
//# sourceMappingURL=security-headers.middleware.d.ts.map