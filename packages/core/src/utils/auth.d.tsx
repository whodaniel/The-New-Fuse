import { User } from '../temp_models/User.js';
/**
 * Authentication and authorization module for the API.
 * Handles user registration, login, and session management.
 */
// AuthError and UserExistsError declarations removed as they are no longer defined in the .tsx file.
// Consumers should use AuthenticationError from src/types/error.tsx.
interface JWTPayload {
    sub: string;
    exp: number;
    iat: number;
}
interface DBQuery<T> {
    filter: (condition: boolean) => DBQuery<T>;
    first: () => Promise<T | null>;
}
interface DB {
    query: <T>(entityName: string) => DBQuery<T>;
    add: (entity: unknown) => Promise<void>;
    commit: () => Promise<void>;
    rollback: () => Promise<void>;
    refresh: (entity: unknown) => Promise<void>;
}
interface AuthManager {
    registerUser(username: string, email: string, password: string): Promise<User>;
    loginUser(username: string, password: string): Promise<string>;
    verifyToken(token: string): Promise<JWTPayload>;
}
declare class AuthManagerImpl implements AuthManager {
    db: DB;
    secretKey: string;
    tokenExpireMinutes: number;
    constructor(db: DB, secretKey: string, tokenExpireMinutes?: number);
    registerUser(): Promise<void>;
}
export { AuthManagerImpl };
