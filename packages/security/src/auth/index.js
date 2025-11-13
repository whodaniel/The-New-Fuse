"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.UserCredentials = void 0;
const zod_1 = require("zod");
const UserCredentialsSchema = zod_1.z.object({
    username: zod_1.z.string(),
    password: zod_1.z.string(),
    email: zod_1.z.string().email().optional()
});
exports.UserCredentials = UserCredentialsSchema;
class AuthService {
    jwtSecret;
    constructor(secret) {
        this.jwtSecret = secret;
    }
    async validateCredentials(_credentials) {
        // Validation implementation would go here
        return true;
    }
    generateToken(payload, expiresIn = '1h') {
        // Note: Properly import and use jsonwebtoken
        const jwt = require('jsonwebtoken');
        return jwt.sign(payload, this.jwtSecret, { expiresIn });
    }
    verifyToken(token) {
        try {
            const jwt = require('jsonwebtoken');
            return jwt.verify(token, this.jwtSecret);
        }
        catch {
            return null;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=index.js.map