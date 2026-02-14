/**
 * JWT Authentication Service for Agent Federation
 *
 * ORCHESTRATOR IMPROVEMENT: Security enhancement from federated intelligence
 * - Prevents unauthorized agent registration
 * - Implements capability-based access control
 * - Provides audit trail via token signatures
 */
import jwt from 'jsonwebtoken';
export interface AgentToken {
    agentId: string;
    capabilities: string[];
    platform: string;
    name?: string;
    metadata?: Record<string, any>;
    iat: number;
    exp: number;
}
export interface AgentCredentials {
    id: string;
    name: string;
    capabilities: string[];
    platform: string;
    metadata?: Record<string, any>;
}
export interface JWTAuthConfig {
    secret: string;
    expiresIn?: string;
    algorithm?: jwt.Algorithm;
}
export declare class JWTAuthService {
    private secret;
    private expiresIn;
    private algorithm;
    constructor(config: JWTAuthConfig);
    /**
     * Generate a JWT token for an agent
     */
    generateToken(agent: AgentCredentials): string;
    /**
     * Verify and decode a JWT token
     * Returns null if invalid or expired
     */
    verifyToken(token: string): AgentToken | null;
    /**
     * Decode token without verification (for debugging)
     */
    decodeToken(token: string): AgentToken | null;
    /**
     * Check if an agent has a specific capability
     */
    hasCapability(token: AgentToken, capability: string): boolean;
    /**
     * Check if an agent has all required capabilities
     */
    hasAllCapabilities(token: AgentToken, requiredCapabilities: string[]): boolean;
    /**
     * Refresh a token (generates new token with updated expiry)
     */
    refreshToken(oldToken: string): string | null;
}
/**
 * Create a singleton instance for use across the relay
 */
export declare function createAuthService(config?: Partial<JWTAuthConfig>): JWTAuthService;
//# sourceMappingURL=JWTAuthService.d.ts.map