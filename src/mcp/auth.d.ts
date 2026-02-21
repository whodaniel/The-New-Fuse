import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
interface CustomLogger {
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
 * Simple API Key Authentication Guard.
 * Checks for 'X-API-Key' header and validates against a set of known keys.
 * Attaches agentId to the request object if authentication succeeds.
 */
export declare class ApiKeyAuthGuard implements CanActivate {
    private readonly validKeys;
    private readonly logger;
    constructor(validKeys: Set<string>, logger: CustomLogger);
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
}
/**
 * Factory function for creating API Key Auth Guard (for backward compatibility)
 */
export declare const apiKeyAuth: (validKeys: Set<string>, logger: CustomLogger) => ApiKeyAuthGuard;
export {};
//# sourceMappingURL=auth.d.ts.map