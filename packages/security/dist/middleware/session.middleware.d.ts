import { NextFunction, Request, Response } from 'express';
import { AuthUser } from '../services/SessionManager.js';
export interface RequestWithSession extends Request {
    user?: AuthUser;
}
export declare const sessionMiddleware: (req: RequestWithSession, res: Response, next: NextFunction) => void;
//# sourceMappingURL=session.middleware.d.ts.map