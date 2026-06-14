import jwt from 'jsonwebtoken';
export interface AgentTokenPayload {
    agentId: string;
    capabilities: string[];
    platform: string;
    name?: string;
    metadata?: Record<string, any>;
    iat?: number;
    exp?: number;
}
export interface AgentCredentials {
    id: string;
    name: string;
    capabilities: string[];
    platform: string;
    metadata?: Record<string, any>;
}
export interface JWTConfig {
    secret: string;
    expiresIn?: string;
    algorithm?: jwt.Algorithm;
}
/**
 * Unified Agent Authentication Service
 *
 * Handles JWT issuance and verification for AI agents.
 */
export declare class AgentAuthService {
    private secret;
    private expiresIn;
    private algorithm;
    constructor(config: JWTConfig);
    generateToken(agent: AgentCredentials): string;
    verifyToken(token: string): AgentTokenPayload | null;
    hasCapability(token: AgentTokenPayload, capability: string): boolean;
}
//# sourceMappingURL=AgentAuthService.d.ts.map