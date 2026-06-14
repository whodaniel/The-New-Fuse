import { desc, eq, inArray, or } from 'drizzle-orm';
import { db } from '../client.js';
import { authSessions, users } from '../schema.js';
/**
 * User Repository - provides data access for User entities
 */
export class DrizzleUserRepository {
    /**
     * Create a new user
     */
    async create(data) {
        // If an explicit ID is provided (e.g. valid UUID), use it.
        // Otherwise, omit the id property entirely so the database generates a valid random UUID.
        const valuesToInsert = { ...data };
        if (!valuesToInsert.id) {
            delete valuesToInsert.id;
        }
        const [user] = await db
            .insert(users)
            .values(valuesToInsert)
            .returning();
        return user;
    }
    /**
     * Find user by ID
     */
    async findById(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user ?? null;
    }
    /**
     * Find user by email
     */
    async findByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user ?? null;
    }
    /**
     * Find user by wallet address
     */
    async findByWalletAddress(walletAddress) {
        const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
        return user ?? null;
    }
    /**
     * Find user by verification token
     */
    async findByVerificationToken(token) {
        const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
        return user ?? null;
    }
    /**
     * Find user by username
     */
    async findByUsername(username) {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user ?? null;
    }
    /**
     * Find user by email or username
     */
    async findByEmailOrUsername(emailOrUsername) {
        const [user] = await db
            .select()
            .from(users)
            .where(or(eq(users.email, emailOrUsername), eq(users.username, emailOrUsername)));
        return user ?? null;
    }
    /**
     * Find all active users
     */
    async findActive() {
        return db.select().from(users).where(eq(users.isActive, true)).orderBy(desc(users.createdAt));
    }
    /**
     * Find users by role
     */
    async findByRole(role) {
        return db
            .select()
            .from(users)
            .where(eq(users.role, role))
            .orderBy(desc(users.createdAt));
    }
    /**
     * Update user
     */
    async update(id, data) {
        const [user] = await db
            .update(users)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        return user ?? null;
    }
    /**
     * Update user password
     */
    async updatePassword(id, hashedPassword) {
        const [user] = await db
            .update(users)
            .set({ hashedPassword, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        return user ?? null;
    }
    /**
     * Update user refresh token
     */
    async updateRefreshToken(id, refreshToken) {
        const [user] = await db
            .update(users)
            .set({ refreshToken, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        return user ?? null;
    }
    /**
     * Update last login timestamp
     */
    async updateLastLogin(id) {
        const [user] = await db
            .update(users)
            .set({ lastLogin: new Date(), updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        return user ?? null;
    }
    /**
     * Verify user email
     */
    async verifyEmail(id) {
        const [user] = await db
            .update(users)
            .set({ emailVerified: true, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        return user ?? null;
    }
    /**
     * Activate user account
     */
    async activate(id) {
        const [user] = await db
            .update(users)
            .set({ isActive: true, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        return user ?? null;
    }
    /**
     * Deactivate user account
     */
    async deactivate(id) {
        const [user] = await db
            .update(users)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        return user ?? null;
    }
    /**
     * Soft delete user
     */
    async softDelete(id) {
        const result = await db
            .update(users)
            .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        return result.length > 0;
    }
    /**
     * Alias for softDelete - preferred method for deleting users
     */
    async delete(id) {
        return this.softDelete(id);
    }
    /**
     * Find all users with optional pagination
     */
    async findAll(limit, offset) {
        let query = db.select().from(users).orderBy(desc(users.createdAt));
        if (limit !== undefined) {
            query = query.limit(limit);
        }
        if (offset !== undefined) {
            query = query.offset(offset);
        }
        return query;
    }
    /**
     * Find users by IDs
     */
    async findUsersByIds(ids) {
        if (ids.length === 0)
            return [];
        return db.select().from(users).where(inArray(users.id, ids));
    }
    /**
     * Hard delete user (use with caution)
     */
    async hardDelete(id) {
        const result = await db.delete(users).where(eq(users.id, id)).returning();
        return result.length > 0;
    }
    /**
     * Count total users
     */
    async count() {
        const result = await db.select({ count: db.$count(users) }).from(users);
        return result[0]?.count ?? 0;
    }
    /**
     * Create auth session for user
     */
    async createSession(userId, token, expiresAt) {
        await db.insert(authSessions).values({
            userId,
            token,
            expiresAt,
        });
    }
    /**
     * Delete auth session
     */
    async deleteSession(token) {
        await db.delete(authSessions).where(eq(authSessions.token, token));
    }
    /**
     * Delete all sessions for user
     */
    async deleteAllSessions(userId) {
        await db.delete(authSessions).where(eq(authSessions.userId, userId));
    }
    /**
     * Find session by token
     */
    async findSessionByToken(token) {
        const [session] = await db.select().from(authSessions).where(eq(authSessions.token, token));
        return session ?? null;
    }
}
// Export singleton instance
export const drizzleUserRepository = new DrizzleUserRepository();
//# sourceMappingURL=user.repository.js.map