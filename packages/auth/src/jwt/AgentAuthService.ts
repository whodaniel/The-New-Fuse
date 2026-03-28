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
export class AgentAuthService {
  private secret: string;
  private expiresIn: string;
  private algorithm: jwt.Algorithm;

  constructor(config: JWTConfig) {
    this.secret = config.secret;
    this.expiresIn = config.expiresIn || '24h';
    this.algorithm = config.algorithm || 'HS256';

    if (!this.secret || this.secret.length < 32) {
      throw new Error('[AgentAuth] Invalid or missing secret. Must be at least 32 characters.');
    }
  }

  generateToken(agent: AgentCredentials): string {
    const payload: Omit<AgentTokenPayload, 'iat' | 'exp'> = {
      agentId: agent.id,
      name: agent.name,
      capabilities: agent.capabilities,
      platform: agent.platform,
      metadata: agent.metadata,
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn as any,
      algorithm: this.algorithm as any,
    });
  }

  verifyToken(token: string): AgentTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: [this.algorithm],
      }) as AgentTokenPayload;

      if (!decoded.agentId || !decoded.capabilities || !decoded.platform) {
        return null;
      }

      return decoded;
    } catch {
      return null;
    }
  }

  hasCapability(token: AgentTokenPayload, capability: string): boolean {
    return token.capabilities.includes(capability);
  }
}
