/**
 * API Key Auth Guard for NestJS authentication
 */
import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class ApiKeyAuthGuard implements CanActivate {
    private readonly logger;
    constructor();
    /**
     * Handle API key authentication
     * @param context The execution context
     * @returns boolean Whether the API key is valid
     */
    canActivate(context: ExecutionContext): Promise<boolean>;
}
//# sourceMappingURL=api-key-auth.guard.d.ts.map