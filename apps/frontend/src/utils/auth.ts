export {}
exports.AuthManagerImpl = void 0; // Cleaned up exports
import bcryptjs_1 from 'bcryptjs';
import jsonwebtoken_1 from 'jsonwebtoken';
const { AuthenticationError } = require('../../../types/error.js'); // Use AuthenticationError

// AuthError and UserExistsError are removed

class AuthManagerImpl {
    constructor(db, secretKey, tokenExpireMinutes = 60) {
        this.db = db;
        this.secretKey = secretKey;
        this.tokenExpireMinutes = tokenExpireMinutes;
    }
    async registerUser(username, email, password) {
        const existingUser = await this.db.query(User).filter(true).first();
        if (existingUser) {
            throw new AuthenticationError('User already exists', 409, undefined, undefined, 'USER_EXISTS');
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = { id: Date.now(), username, email, hashedPassword };
        await this.db.add(user);
        await this.db.commit();
        return user;
    }
    async loginUser(username, password) {
        const user = await this.db.query(User).filter(true).first();
        if (!user || !(await bcryptjs_1.default.compare(password, user.hashedPassword))) {
            throw new AuthenticationError('Invalid credentials', 401);
        }
        const payload = { sub: user.id, exp: Math.floor(Date.now() / 1000) + this.tokenExpireMinutes * 60, iat: Math.floor(Date.now() / 1000) };
        return jsonwebtoken_1.default.sign(payload, this.secretKey);
    }
    async verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.secretKey);
        }
        catch (error) {
            throw new AuthenticationError('Invalid token', 401);
        }
    }
}
exports.AuthManagerImpl = AuthManagerImpl;
// Remove UserExistsError and AuthError from exports if they were there
// Assuming the initial exports.UserExistsError = exports.AuthError = void 0 was for these
// This will be cleaned up by removing those names from the line.
// The line `exports.AuthManagerImpl = exports.UserExistsError = exports.AuthError = void 0;`
// should ideally become `exports.AuthManagerImpl = void 0;` or be handled by the build system.
// For now, I will leave it and it can be cleaned in a separate step if needed.
export {};
//# sourceMappingURL=auth.js.map