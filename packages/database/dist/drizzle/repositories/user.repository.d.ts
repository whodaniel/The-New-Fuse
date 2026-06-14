import type { NewUser, User } from '../types/index.js';
/**
 * User Repository - provides data access for User entities
 */
export declare class DrizzleUserRepository {
    /**
     * Create a new user
     */
    create(data: Omit<NewUser, 'id'> & {
        id?: string;
    }): Promise<User>;
    /**
     * Find user by ID
     */
    findById(id: string): Promise<User | null>;
    /**
     * Find user by email
     */
    findByEmail(email: string): Promise<User | null>;
    /**
     * Find user by wallet address
     */
    findByWalletAddress(walletAddress: string): Promise<User | null>;
    /**
     * Find user by verification token
     */
    findByVerificationToken(token: string): Promise<User | null>;
    /**
     * Find user by username
     */
    findByUsername(username: string): Promise<User | null>;
    /**
     * Find user by email or username
     */
    findByEmailOrUsername(emailOrUsername: string): Promise<User | null>;
    /**
     * Find all active users
     */
    findActive(): Promise<User[]>;
    /**
     * Find users by role
     */
    findByRole(role: string): Promise<User[]>;
    /**
     * Update user
     */
    update(id: string, data: Partial<NewUser>): Promise<User | null>;
    /**
     * Update user password
     */
    updatePassword(id: string, hashedPassword: string): Promise<User | null>;
    /**
     * Update user refresh token
     */
    updateRefreshToken(id: string, refreshToken: string | null): Promise<User | null>;
    /**
     * Update last login timestamp
     */
    updateLastLogin(id: string): Promise<User | null>;
    /**
     * Verify user email
     */
    verifyEmail(id: string): Promise<User | null>;
    /**
     * Activate user account
     */
    activate(id: string): Promise<User | null>;
    /**
     * Deactivate user account
     */
    deactivate(id: string): Promise<User | null>;
    /**
     * Soft delete user
     */
    softDelete(id: string): Promise<boolean>;
    /**
     * Alias for softDelete - preferred method for deleting users
     */
    delete(id: string): Promise<boolean>;
    /**
     * Find all users with optional pagination
     */
    findAll(limit?: number, offset?: number): Promise<User[]>;
    /**
     * Find users by IDs
     */
    findUsersByIds(ids: string[]): Promise<User[]>;
    /**
     * Hard delete user (use with caution)
     */
    hardDelete(id: string): Promise<boolean>;
    /**
     * Count total users
     */
    count(): Promise<number>;
    /**
     * Create auth session for user
     */
    createSession(userId: string, token: string, expiresAt: Date): Promise<void>;
    /**
     * Delete auth session
     */
    deleteSession(token: string): Promise<void>;
    /**
     * Delete all sessions for user
     */
    deleteAllSessions(userId: string): Promise<void>;
    /**
     * Find session by token
     */
    findSessionByToken(token: string): Promise<{
        id: string;
        userId: string;
        token: string;
        expiresAt: Date;
        createdAt: Date;
    }>;
}
export declare const drizzleUserRepository: DrizzleUserRepository;
//# sourceMappingURL=user.repository.d.ts.map