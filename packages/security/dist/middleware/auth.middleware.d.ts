import { NextFunction, Request, Response } from 'express';
import { AuthUser } from '../services/SessionManager.js';
export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}
export declare const authMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export default authMiddleware;
//# sourceMappingURL=auth.middleware.d.ts.map