export {}
exports.AuthManagerImpl = exports.UserExistsError = exports.AuthError = void 0;
import bcryptjs_1 from 'bcryptjs';
import jsonwebtoken_1 from 'jsonwebtoken';
class AuthError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthError';
    }
}
exports.AuthError = AuthError;
class UserExistsError extends AuthError {
    constructor(message) {
        super(message);
        this.name = 'UserExistsError';
    }
}
exports.UserExistsError = UserExistsError;
class AuthManagerImpl {
    constructor(db, secretKey, tokenExpireMinutes = 60) {
        this.db = db;
        this.secretKey = secretKey;
        this.tokenExpireMinutes = tokenExpireMinutes;
    }
    async registerUser(username, email, password) {
        const existingUser = await this.db.query(User).filter(true).first();
        if (existingUser) {
            throw new UserExistsError('User already exists');
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
            throw new AuthError('Invalid credentials');
        }
        const payload = { sub: user.id, exp: Math.floor(Date.now() / 1000) + this.tokenExpireMinutes * 60, iat: Math.floor(Date.now() / 1000) };
        return jsonwebtoken_1.default.sign(payload, this.secretKey);
    }
    async verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.secretKey);
        }
        catch (error) {
            throw new AuthError('Invalid token');
        }
    }
}
exports.AuthManagerImpl = AuthManagerImpl;
export {};
//# sourceMappingURL=auth.js.map