import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: User;
            userId?: string;
        }
    }
}
export declare const auth: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
