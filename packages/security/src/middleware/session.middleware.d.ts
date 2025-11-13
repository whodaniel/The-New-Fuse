import { Request, Response, NextFunction } from 'express';
import { AuthUser } from '../services/SessionManager';
export interface RequestWithSession extends Request {
    user?: AuthUser;
}
export declare const sessionMiddleware: (req: RequestWithSession, res: Response, next: NextFunction) => void;
//# sourceMappingURL=session.middleware.d.ts.map