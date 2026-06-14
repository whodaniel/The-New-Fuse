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
    /**
     * Extract API key from request
     * @param request HTTP request
     * @returns string | undefined
     */
    private extractApiKey;
    /**
     * Validate the API key
     * @param apiKey The API key to validate
     * @returns Promise<boolean> Whether the API key is valid
     */
    private validateApiKey;
}
//# sourceMappingURL=api-key-auth.guard.d.ts.map