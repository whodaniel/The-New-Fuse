import * as bcrypt from 'bcrypt';
import { z } from 'zod';
const UserCredentialsSchema = z.object({
    username: z.string(),
    password: z.string(),
    email: z.string().email().optional(),
});
export const UserCredentials = UserCredentialsSchema;
export class AuthService {
    constructor(secret, userRepository) {
        this.jwtSecret = secret;
        this.userRepository = userRepository;
    }
    /**
     * Validates user credentials against the configured user store.
     *
     * @throws {Error} If no user repository is configured
     * @param {UserCredentialsType} credentials - The credentials to validate
     * @returns {Promise<boolean>} Promise resolving to true if valid, false otherwise
     */
    async validateCredentials(credentials) {
        // TODO: Inject UserRepository for production use
        // For now, throw to prevent silent security bypass
        if (!this.userRepository) {
            throw new Error('AuthService.validateCredentials: No user repository configured. ' +
                'Inject a UserRepository implementation or use a different auth method.');
        }
        const user = await this.userRepository.findByUsername(credentials.username);
        if (!user || !user.passwordHash)
            return false;
        // Use bcrypt or similar for password comparison
        return bcrypt.compare(credentials.password, user.passwordHash);
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
//# sourceMappingURL=index.js.map