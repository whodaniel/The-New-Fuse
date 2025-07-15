import { Request, Response, NextFunction } from 'express';
interface Logger {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string, error?: any) => void;
}
declare global {
    namespace Express {
        interface Request {
            agentId?: string;
        }
    }
}
/**
 * Simple API Key Authentication Middleware.
 * Checks for 'X-API-Key' header and validates against a set of known keys.
 * Attaches agentId to the request object if authentication succeeds.
 */
export declare const apiKeyAuth: (validKeys: Set<string>, logger: Logger) => (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=auth.d.ts.map