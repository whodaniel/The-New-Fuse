/**
 * User Repository - Drizzle ORM Implementation
 * Migrated from Prisma to Drizzle using the Repository Pattern
 */
import { and, desc, eq, inArray, isNull, or } from 'drizzle-orm';
import { db } from '../client';
import { authSessions, users } from '../schema';
import type { NewUser, User } from '../types';

/**
 * User Repository - provides data access for User entities
 */
export class DrizzleUserRepository {
  /**
   * Create a new user
   */
  async create(data: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)));

    return user ?? null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)));

    return user ?? null;
  }

  /**
   * Find user by wallet address
   */
  async findByWalletAddress(walletAddress: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.walletAddress, walletAddress), isNull(users.deletedAt)));

    return user ?? null;
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username), isNull(users.deletedAt)));

    return user ?? null;
  }

  /**
   * Find user by email or username
   */
  async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          or(eq(users.email, emailOrUsername), eq(users.username, emailOrUsername)),
          isNull(users.deletedAt)
        )
      );

    return user ?? null;
  }

  /**
   * Find all active users
   */
  async findActive(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(and(eq(users.isActive, true), isNull(users.deletedAt)))
      .orderBy(desc(users.createdAt));
  }

  /**
   * Find users by role
   */
  async findByRole(role: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(and(eq(users.role, role as any), isNull(users.deletedAt)))
      .orderBy(desc(users.createdAt));
  }

  /**
   * Update user
   */
  async update(id: string, data: Partial<NewUser>): Promise<User | null> {
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
  async updatePassword(id: string, hashedPassword: string): Promise<User | null> {
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
  async updateRefreshToken(id: string, refreshToken: string | null): Promise<User | null> {
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
  async updateLastLogin(id: string): Promise<User | null> {
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
  async verifyEmail(id: string): Promise<User | null> {
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
  async activate(id: string): Promise<User | null> {
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
  async deactivate(id: string): Promise<User | null> {
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
  async softDelete(id: string): Promise<boolean> {
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
  async delete(id: string): Promise<boolean> {
    return this.softDelete(id);
  }

  /**
   * Find all users with optional pagination
   */
  async findAll(limit?: number, offset?: number): Promise<User[]> {
    let query = db
      .select()
      .from(users)
      .where(isNull(users.deletedAt))
      .orderBy(desc(users.createdAt));

    if (limit !== undefined) {
      query = query.limit(limit) as any;
    }
    if (offset !== undefined) {
      query = query.offset(offset) as any;
    }

    return query;
  }

  /**
   * Find users by IDs
   */
  async findUsersByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];

    return db
      .select()
      .from(users)
      .where(and(inArray(users.id, ids), isNull(users.deletedAt)));
  }

  /**
   * Hard delete user (use with caution)
   */
  async hardDelete(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  /**
   * Count total users
   */
  async count(): Promise<number> {
    const result = await db
      .select({ count: db.$count(users) })
      .from(users)
      .where(isNull(users.deletedAt));

    return result[0]?.count ?? 0;
  }

  /**
   * Create auth session for user
   */
  async createSession(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(authSessions).values({
      userId,
      token,
      expiresAt,
    });
  }

  /**
   * Delete auth session
   */
  async deleteSession(token: string): Promise<void> {
    await db.delete(authSessions).where(eq(authSessions.token, token));
  }

  /**
   * Delete all sessions for user
   */
  async deleteAllSessions(userId: string): Promise<void> {
    await db.delete(authSessions).where(eq(authSessions.userId, userId));
  }

  /**
   * Find session by token
   */
  async findSessionByToken(token: string) {
    const [session] = await db.select().from(authSessions).where(eq(authSessions.token, token));

    return session ?? null;
  }
}

// Export singleton instance
export const drizzleUserRepository = new DrizzleUserRepository();
