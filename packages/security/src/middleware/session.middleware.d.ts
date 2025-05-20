import { Request, Response, NextFunction } from 'express';
export interface SessionRequest extends Request {
    session?: Session;
    user?: AuthUser;
}
export declare const sessionMiddleware: SessionRequest, res: Response, next: NextFunction;
