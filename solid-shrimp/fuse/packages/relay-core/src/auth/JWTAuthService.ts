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

export class JWTAuthService {
  private secret: string;
  private expiresIn: string;
  private algorithm: jwt.Algorithm;

  constructor(config: JWTAuthConfig) {
    this.secret = config.secret;
    this.expiresIn = config.expiresIn || '24h';
    this.algorithm = config.algorithm || 'HS256';

    if (!this.secret || this.secret === 'dev-secret-change-in-production') {
      console.warn(
        '[JWTAuth] ⚠️  WARNING: Using default JWT secret. Set JWT_SECRET in production!'
      );
    }
  }

  /**
   * Generate a JWT token for an agent
   */
  generateToken(agent: AgentCredentials): string {
    const payload: Omit<AgentToken, 'iat' | 'exp'> = {
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

  /**
   * Verify and decode a JWT token
   * Returns null if invalid or expired
   */
  verifyToken(token: string): AgentToken | null {
    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: [this.algorithm],
      }) as AgentToken;

      // Validate required fields
      if (!decoded.agentId || !decoded.capabilities || !decoded.platform) {
        console.error('[JWTAuth] Token missing required fields');
        return null;
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        console.warn('[JWTAuth] Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        console.warn('[JWTAuth] Invalid token:', error.message);
      } else {
        console.error('[JWTAuth] Token verification error:', error);
      }
      return null;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): AgentToken | null {
    try {
      return jwt.decode(token) as AgentToken;
    } catch (error) {
      console.error('[JWTAuth] Token decode error:', error);
      return null;
    }
  }

  /**
   * Check if an agent has a specific capability
   */
  hasCapability(token: AgentToken, capability: string): boolean {
    return token.capabilities.includes(capability);
  }

  /**
   * Check if an agent has all required capabilities
   */
  hasAllCapabilities(token: AgentToken, requiredCapabilities: string[]): boolean {
    return requiredCapabilities.every((cap) => token.capabilities.includes(cap));
  }

  /**
   * Refresh a token (generates new token with updated expiry)
   */
  refreshToken(oldToken: string): string | null {
    const verified = this.verifyToken(oldToken);
    if (!verified) return null;

    return this.generateToken({
      id: verified.agentId,
      name: verified.name || 'Unknown Agent',
      capabilities: verified.capabilities,
      platform: verified.platform,
      metadata: verified.metadata,
    });
  }
}

/**
 * Create a singleton instance for use across the relay
 */
export function createAuthService(config?: Partial<JWTAuthConfig>): JWTAuthService {
  const secret = config?.secret || process.env.JWT_SECRET || 'dev-secret-change-in-production';

  return new JWTAuthService({
    secret,
    expiresIn: config?.expiresIn || '24h',
    algorithm: config?.algorithm || 'HS256',
  });
}
