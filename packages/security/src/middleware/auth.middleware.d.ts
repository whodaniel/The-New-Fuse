import { Request, Response, NextFunction } from 'express';
import { AuthUser } from '../services/SessionManager';
export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}
export declare const authMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export default authMiddleware;
//# sourceMappingURL=auth.middleware.d.ts.map