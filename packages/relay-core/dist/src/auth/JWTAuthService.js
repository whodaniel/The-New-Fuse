/**
 * JWT Authentication Service for Agent Federation
 *
 * ORCHESTRATOR IMPROVEMENT: Security enhancement from federated intelligence
 * - Prevents unauthorized agent registration
 * - Implements capability-based access control
 * - Provides audit trail via token signatures
 */
import jwt from 'jsonwebtoken';
export class JWTAuthService {
    constructor(config) {
        this.secret = config.secret;
        this.expiresIn = config.expiresIn || '24h';
        this.algorithm = config.algorithm || 'HS256';
        if (!this.secret || this.secret === 'dev-secret-change-in-production' || this.secret.length < 32) {
            throw new Error('[JWTAuth] 🛑 CRITICAL SECURITY ERROR: Invalid or missing JWT secret. Must provide a strong JWT_SECRET environment variable (at least 32 characters).');
        }
    }
    /**
     * Generate a JWT token for an agent
     */
    generateToken(agent) {
        const payload = {
            agentId: agent.id,
            name: agent.name,
            capabilities: agent.capabilities,
            platform: agent.platform,
            metadata: agent.metadata,
        };
        return jwt.sign(payload, this.secret, {
            expiresIn: this.expiresIn,
            algorithm: this.algorithm,
        });
    }
    /**
     * Verify and decode a JWT token
     * Returns null if invalid or expired
     */
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.secret, {
                algorithms: [this.algorithm],
            });
            // Validate required fields
            if (!decoded.agentId || !decoded.capabilities || !decoded.platform) {
                console.error('[JWTAuth] Token missing required fields');
                return null;
            }
            return decoded;
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                console.warn('[JWTAuth] Token expired');
            }
            else if (error instanceof jwt.JsonWebTokenError) {
                console.warn('[JWTAuth] Invalid token:', error.message);
            }
            else {
                console.error('[JWTAuth] Token verification error:', error);
            }
            return null;
        }
    }
    /**
     * Decode token without verification (for debugging)
     */
    decodeToken(token) {
        try {
            return jwt.decode(token);
        }
        catch (error) {
            console.error('[JWTAuth] Token decode error:', error);
            return null;
        }
    }
    /**
     * Check if an agent has a specific capability
     */
    hasCapability(token, capability) {
        return token.capabilities.includes(capability);
    }
    /**
     * Check if an agent has all required capabilities
     */
    hasAllCapabilities(token, requiredCapabilities) {
        return requiredCapabilities.every((cap) => token.capabilities.includes(cap));
    }
    /**
     * Refresh a token (generates new token with updated expiry)
     */
    refreshToken(oldToken) {
        const verified = this.verifyToken(oldToken);
        if (!verified)
            return null;
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
export function createAuthService(config) {
    const secret = config?.secret || process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('[JWTAuth] 🛑 CRITICAL SECURITY ERROR: JWT secret is required. Must provide a strong JWT_SECRET environment variable.');
    }
    return new JWTAuthService({
        secret,
        expiresIn: config?.expiresIn || '24h',
        algorithm: config?.algorithm || 'HS256',
    });
}
//# sourceMappingURL=JWTAuthService.js.map