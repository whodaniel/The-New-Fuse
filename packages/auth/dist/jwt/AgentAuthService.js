"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentAuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Unified Agent Authentication Service
 *
 * Handles JWT issuance and verification for AI agents.
 */
class AgentAuthService {
    constructor(config) {
        this.secret = config.secret;
        this.expiresIn = config.expiresIn || '24h';
        this.algorithm = config.algorithm || 'HS256';
        if (!this.secret || this.secret.length < 32) {
            throw new Error('[AgentAuth] Invalid or missing secret. Must be at least 32 characters.');
        }
    }
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
    verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.secret, {
                algorithms: [this.algorithm],
            });
            if (!decoded.agentId || !decoded.capabilities || !decoded.platform) {
                return null;
            }
            return decoded;
        }
        catch {
            return null;
        }
    }
    hasCapability(token, capability) {
        return token.capabilities.includes(capability);
    }
}
exports.AgentAuthService = AgentAuthService;
//# sourceMappingURL=AgentAuthService.js.map