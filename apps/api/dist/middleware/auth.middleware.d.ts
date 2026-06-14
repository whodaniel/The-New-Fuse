/**
 * Authentication Middleware - JWT token validation
 */
import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
export declare function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export {};
//# sourceMappingURL=auth.middleware.d.ts.map