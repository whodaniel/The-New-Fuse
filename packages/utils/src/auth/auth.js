exports.AuthManagerImpl = void 0; // Cleaned up exports
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Create a local AuthenticationError class since the import is broken
export class AuthenticationError extends Error {
    constructor(message, statusCode, cause, stack, code) {
        super(message);
        this.name = 'AuthenticationError';
        this.statusCode = statusCode;
        this.code = code;
        if (cause) {
            this.cause = cause;
        }
        if (stack) {
            this.stack = stack;
        }
    }
}
export class AuthManagerImpl {
    constructor(db, secretKey, tokenExpireMinutes = 60) {
        this.db = db;
        this.secretKey = secretKey;
        this.tokenExpireMinutes = tokenExpireMinutes;
    }
    async registerUser(username, email, password) {
        // Check if user already exists
        const existingUser = await this.db.query()
            .filter((user) => user.username === username || user.email === email)
            .first();
        if (existingUser) {
            throw new AuthenticationError('User with this username or email already exists');
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create new user
        const newUser = {
            id: Date.now(),
            username,
            email,
            hashedPassword
        };
        try {
            await this.db.add(newUser);
            await this.db.commit();
            return newUser;
        }
        catch (error) {
            await this.db.rollback();
            throw new AuthenticationError('Failed to create user');
        }
    }
    async loginUser(username, password) {
        const user = await this.db.query()
            .filter((user) => user.username === username)
            .first();
        if (!user) {
            throw new AuthenticationError('Invalid username or password');
        }
        const validPassword = await bcrypt.compare(password, user.hashedPassword);
        if (!validPassword) {
            throw new AuthenticationError('Invalid username or password');
        }
        // Generate JWT
        const token = jwt.sign({ sub: user.id.toString() }, this.secretKey, {
            expiresIn: `${this.tokenExpireMinutes}m`
        });
        return token;
    }
    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.secretKey);
            return decoded;
        }
        catch (error) {
            throw new AuthenticationError('Invalid or expired token');
        }
    }
    async validateToken(token) {
        try {
            await this.verifyToken(token);
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.AuthManagerImpl = AuthManagerImpl;
//# sourceMappingURL=auth.js.map
//# sourceMappingURL=auth.js.map