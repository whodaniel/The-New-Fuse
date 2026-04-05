"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleUserRepository = exports.DrizzleUserRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
/**
 * User Repository - provides data access for User entities
 */
class DrizzleUserRepository {
    /**
     * Create a new user
     */
    async create(data) {
        // Exacting Tracking Standard: user_${SanitizedName}_${Timestamp}
        const sanitizedName = (data.username || 'anonymous').toLowerCase().replace(/[^a-z0-9]/g, '');
        const id = data.id || `user_${sanitizedName}_${Date.now()}`;
        const [user] = await client_1.db
            .insert(schema_1.users)
            .values({ ...data, id })
            .returning();
        return user;
    }
    /**
     * Find user by ID
     */
    async findById(id) {
        const [user] = await client_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        return user ?? null;
    }
    /**
     * Find user by email
     */
    async findByEmail(email) {
        const [user] = await client_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        return user ?? null;
    }
    /**
     * Find user by wallet address
     */
    async findByWalletAddress(walletAddress) {
        const [user] = await client_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.walletAddress, walletAddress));
        return user ?? null;
    }
    /**
     * Find user by verification token
     */
    async findByVerificationToken(token) {
        const [user] = await client_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.verificationToken, token));
        return user ?? null;
    }
    /**
     * Find user by username
     */
    async findByUsername(username) {
        const [user] = await client_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username));
        return user ?? null;
    }
    /**
     * Find user by email or username
     */
    async findByEmailOrUsername(emailOrUsername) {
        const [user] = await client_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.email, emailOrUsername), (0, drizzle_orm_1.eq)(schema_1.users.username, emailOrUsername)));
        return user ?? null;
    }
    /**
     * Find all active users
     */
    async findActive() {
        return client_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.isActive, true)).orderBy((0, drizzle_orm_1.desc)(schema_1.users.createdAt));
    }
    /**
     * Find users by role
     */
    async findByRole(role) {
        return client_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.role, role))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.users.createdAt));
    }
    /**
     * Update user
     */
    async update(id, data) {
        const [user] = await client_1.db
            .update(schema_1.users)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        return user ?? null;
    }
    /**
     * Update user password
     */
    async updatePassword(id, hashedPassword) {
        const [user] = await client_1.db
            .update(schema_1.users)
            .set({ hashedPassword, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        return user ?? null;
    }
    /**
     * Update user refresh token
     */
    async updateRefreshToken(id, refreshToken) {
        const [user] = await client_1.db
            .update(schema_1.users)
            .set({ refreshToken, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        return user ?? null;
    }
    /**
     * Update last login timestamp
     */
    async updateLastLogin(id) {
        const [user] = await client_1.db
            .update(schema_1.users)
            .set({ lastLogin: new Date(), updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        return user ?? null;
    }
    /**
     * Verify user email
     */
    async verifyEmail(id) {
        const [user] = await client_1.db
            .update(schema_1.users)
            .set({ emailVerified: true, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        return user ?? null;
    }
    /**
     * Activate user account
     */
    async activate(id) {
        const [user] = await client_1.db
            .update(schema_1.users)
            .set({ isActive: true, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        return user ?? null;
    }
    /**
     * Deactivate user account
     */
    async deactivate(id) {
        const [user] = await client_1.db
            .update(schema_1.users)
            .set({ isActive: false, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        return user ?? null;
    }
    /**
     * Soft delete user
     */
    async softDelete(id) {
        const result = await client_1.db
            .update(schema_1.users)
            .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
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
        let query = client_1.db.select().from(schema_1.users).orderBy((0, drizzle_orm_1.desc)(schema_1.users.createdAt));
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
        return client_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.inArray)(schema_1.users.id, ids));
    }
    /**
     * Hard delete user (use with caution)
     */
    async hardDelete(id) {
        const result = await client_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id)).returning();
        return result.length > 0;
    }
    /**
     * Count total users
     */
    async count() {
        const result = await client_1.db.select({ count: client_1.db.$count(schema_1.users) }).from(schema_1.users);
        return result[0]?.count ?? 0;
    }
    /**
     * Create auth session for user
     */
    async createSession(userId, token, expiresAt) {
        await client_1.db.insert(schema_1.authSessions).values({
            userId,
            token,
            expiresAt,
        });
    }
    /**
     * Delete auth session
     */
    async deleteSession(token) {
        await client_1.db.delete(schema_1.authSessions).where((0, drizzle_orm_1.eq)(schema_1.authSessions.token, token));
    }
    /**
     * Delete all sessions for user
     */
    async deleteAllSessions(userId) {
        await client_1.db.delete(schema_1.authSessions).where((0, drizzle_orm_1.eq)(schema_1.authSessions.userId, userId));
    }
    /**
     * Find session by token
     */
    async findSessionByToken(token) {
        const [session] = await client_1.db.select().from(schema_1.authSessions).where((0, drizzle_orm_1.eq)(schema_1.authSessions.token, token));
        return session ?? null;
    }
}
exports.DrizzleUserRepository = DrizzleUserRepository;
// Export singleton instance
exports.drizzleUserRepository = new DrizzleUserRepository();
//# sourceMappingURL=user.repository.js.map