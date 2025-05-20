
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const thisObj = (typeof globalThis !== 'undefined' ? globalThis : {});
export {}
exports.AuthManagerImpl = exports.UserExistsError = exports.AuthError = void 0;
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Mock Database type since the actual module is not available
interface Database {
    query<T = any>(): {
        filter: (predicate: (item: T) => boolean) => {
            first: () => Promise<T | null>;
        };
    };
    add: (item: any) => Promise<void>;
    commit: () => Promise<void>;
    rollback: () => Promise<void>;
}
/**
 * Authentication and authorization module for the API.
 * Handles user registration, login, and session management.
 */
// Custom error types
export class AuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthError';
    }
}
exports.AuthError = AuthError;
export class UserExistsError extends AuthError {
    constructor(message: string) {
        super(message);
        this.name = 'UserExistsError';
    }
}
exports.UserExistsError = UserExistsError;

interface User {
    id: number;
    username: string;
    email: string;
    hashedPassword: string;
}

interface TokenPayload {
    sub: string;
    iat: number;
    exp: number;
}

export class AuthManagerImpl {
    private db: Database;
    private secretKey: string;
    private tokenExpireMinutes: number;

    constructor(db: Database, secretKey: string, tokenExpireMinutes = 60) {
        this.db = db;
        this.secretKey = secretKey;
        this.tokenExpireMinutes = tokenExpireMinutes;
    }

    async registerUser(username: string, email: string, password: string): Promise<User> {
        // Check if user already exists
        const existingUser = await this.db.query<User>()
            .filter((user: User) => user.username === username || user.email === email)
            .first();

        if (existingUser) {
            throw new UserExistsError('User with this username or email already exists');
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
        } catch (error) {
            await this.db.rollback();
            throw new AuthError('Failed to create user');
        }
    }

    async loginUser(username: string, password: string): Promise<string> {
        const user = await this.db.query<User>()
            .filter((user: User) => user.username === username)
            .first();

        if (!user) {
            throw new AuthError('Invalid username or password');
        }

        const validPassword = await bcrypt.compare(password, user.hashedPassword);
        if (!validPassword) {
            throw new AuthError('Invalid username or password');
        }

        // Generate JWT
        const token = jwt.sign({ sub: user.id.toString() }, this.secretKey, {
            expiresIn: `${this.tokenExpireMinutes}m`
        });

        return token;
    }

    async verifyToken(token: string): Promise<TokenPayload> {
        try {
            const decoded = jwt.verify(token, this.secretKey) as TokenPayload;
            return decoded;
        } catch (error) {
            throw new AuthError('Invalid or expired token');
        }
    }

    async validateToken(token: string): Promise<boolean> {
        try {
            await this.verifyToken(token);
            return true;
        } catch (error) {
            return false;
        }
    }
}
exports.AuthManagerImpl = AuthManagerImpl;
//# sourceMappingURL=auth.js.map
