/**
 * Agent Authentication Guard
 * Protects routes that require agent-specific authentication
 * Handles both JWT tokens and agent-specific API keys
 */
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
export declare class AgentAuthGuard implements CanActivate {
    private readonly jwtService;
    private readonly logger;
    constructor(jwtService: JwtService);
    /**
     * Determines if the current request is authorized for agent access
     * @param context Execution context
     * @returns Promise<boolean> indicating if request is authorized
     */
    canActivate(context: ExecutionContext): Promise<boolean>;
    /**
     * Extract JWT token from Authorization header
     * @param request HTTP request object
     * @returns string | null
     */
    private extractTokenFromHeader;
    /**
     * Extract API key from X-Agent-API-Key header
     * @param request HTTP request object
     * @returns string | null
     */
    private extractApiKeyFromHeader;
    /**
     * Validate JWT token and extract agent information
     * @param token JWT token
     * @param request HTTP request object
     * @returns Promise<boolean>
     */
    private validateJwtToken;
    /**
     * Validate agent API key
     * @param apiKey Agent API key
     * @param request HTTP request object
     * @returns Promise<boolean>
     */
    private validateAgentApiKey;
}
//# sourceMappingURL=agent.auth.guard.d.ts.map