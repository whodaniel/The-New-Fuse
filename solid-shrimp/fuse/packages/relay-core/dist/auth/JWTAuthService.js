"use strict";
/**
 * JWT Authentication Service for Agent Federation
 *
 * ORCHESTRATOR IMPROVEMENT: Security enhancement from federated intelligence
 * - Prevents unauthorized agent registration
 * - Implements capability-based access control
 * - Provides audit trail via token signatures
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTAuthService = void 0;
exports.createAuthService = createAuthService;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JWTAuthService {
    secret;
    expiresIn;
    algorithm;
    constructor(config) {
        this.secret = config.secret;
        this.expiresIn = config.expiresIn || '24h';
        this.algorithm = config.algorithm || 'HS256';
        if (!this.secret || this.secret === 'dev-secret-change-in-production') {
            console.warn('[JWTAuth] ⚠️  WARNING: Using default JWT secret. Set JWT_SECRET in production!');
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
        return jsonwebtoken_1.default.sign(payload, this.secret, {
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
            const decoded = jsonwebtoken_1.default.verify(token, this.secret, {
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
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                console.warn('[JWTAuth] Token expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
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
            return jsonwebtoken_1.default.decode(token);
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
exports.JWTAuthService = JWTAuthService;
/**
 * Create a singleton instance for use across the relay
 */
function createAuthService(config) {
    const secret = config?.secret || process.env.JWT_SECRET || 'dev-secret-change-in-production';
    return new JWTAuthService({
        secret,
        expiresIn: config?.expiresIn || '24h',
        algorithm: config?.algorithm || 'HS256',
    });
}
//# sourceMappingURL=JWTAuthService.js.map