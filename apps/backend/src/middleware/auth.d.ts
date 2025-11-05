import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: User;
            userId?: string;
        }
    }
}
export declare const auth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map