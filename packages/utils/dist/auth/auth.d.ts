export {};
export declare class AuthenticationError extends Error {
    statusCode?: number;
    code?: string;
    cause?: Error;
    constructor(message: string, statusCode?: number, cause?: Error, stack?: string, code?: string);
}
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
export declare class AuthManagerImpl {
    private db;
    private secretKey;
    private tokenExpireMinutes;
    constructor(db: Database, secretKey: string, tokenExpireMinutes?: number);
    registerUser(username: string, email: string, password: string): Promise<User>;
    loginUser(username: string, password: string): Promise<string>;
    verifyToken(token: string): Promise<TokenPayload>;
    validateToken(token: string): Promise<boolean>;
}
//# sourceMappingURL=auth.d.ts.map