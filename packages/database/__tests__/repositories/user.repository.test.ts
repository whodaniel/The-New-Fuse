/**
 * DrizzleUserRepository Integration Tests
 * Tests all 15 methods of the user repository
 */

import { drizzleUserRepository } from '../../src/drizzle/repositories/user.repository';
import {
  expectDatabaseRow,
  expectDeleted,
  expectNotDeleted,
  expectNotNull,
  expectSoftDeleted,
  expectTimestampInFuture,
  expectValidEmail,
} from '../utils/assertions';
import { futureTimestamp, pastTimestamp } from '../utils/database-helpers';
import { UserFactory } from '../utils/factories';

describe('DrizzleUserRepository', () => {
  describe('create', () => {
    it('should create a new user with valid data', async () => {
      const userData = await UserFactory.build();

      const user = await drizzleUserRepository.create(userData);

      expectDatabaseRow(user, {
        email: userData.email,
        name: userData.name,
      });
      expect(user.hashedPassword).toBe(userData.hashedPassword);
      expect(user.username).toBe(userData.username);
      expectValidEmail(user.email);
      expectNotDeleted(user);
    });

    it('should create user without optional username', async () => {
      const userData = await UserFactory.build({ username: undefined });

      const user = await drizzleUserRepository.create(userData);

      expectDatabaseRow(user, {
        email: userData.email,
        name: userData.name,
      });
      expect(user.username).toBeNull();
    });

    it('should throw error on duplicate email', async () => {
      const userData = await UserFactory.build();
      await drizzleUserRepository.create(userData);

      await expect(drizzleUserRepository.create(userData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const userData = await UserFactory.build();
      const created = await drizzleUserRepository.create(userData);

      const found = await drizzleUserRepository.findById(created.id);

      expectNotNull(found);
      expect(found.id).toBe(created.id);
      expect(found.email).toBe(created.email);
    });

    it('should return null for non-existent ID', async () => {
      const found = await drizzleUserRepository.findById('non-existent-id');

      expect(found).toBeNull();
    });

    it('should not return soft-deleted users', async () => {
      const userData = await UserFactory.build();
      const created = await drizzleUserRepository.create(userData);
      await drizzleUserRepository.softDelete(created.id);

      const found = await drizzleUserRepository.findById(created.id);

      expectSoftDeleted(found);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData = await UserFactory.build();
      const created = await drizzleUserRepository.create(userData);

      const found = await drizzleUserRepository.findByEmail(userData.email);

      expectNotNull(found);
      expect(found.id).toBe(created.id);
      expect(found.email).toBe(userData.email);
    });

    it('should return null for non-existent email', async () => {
      const found = await drizzleUserRepository.findByEmail('nonexistent@example.com');

      expect(found).toBeNull();
    });

    it('should not return soft-deleted users', async () => {
      const userData = await UserFactory.build();
      const created = await drizzleUserRepository.create(userData);
      await drizzleUserRepository.softDelete(created.id);

      const found = await drizzleUserRepository.findByEmail(userData.email);

      expectSoftDeleted(found);
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const userData = await UserFactory.build({ username: 'testuser123' });
      const created = await drizzleUserRepository.create(userData);

      const found = await drizzleUserRepository.findByUsername('testuser123');

      expectNotNull(found);
      expect(found.id).toBe(created.id);
      expect(found.username).toBe('testuser123');
    });

    it('should return null for non-existent username', async () => {
      const found = await drizzleUserRepository.findByUsername('nonexistent');

      expect(found).toBeNull();
    });

    it('should return null when user has no username', async () => {
      const userData = await UserFactory.build({ username: undefined });
      await drizzleUserRepository.create(userData);

      const found = await drizzleUserRepository.findByUsername('testuser123');

      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      const userData = await UserFactory.build();
      const created = await drizzleUserRepository.create(userData);

      const updated = await drizzleUserRepository.update(created.id, {
        name: 'Updated Name',
        username: 'newusername',
      });

      expectNotNull(updated);
      expect(updated.name).toBe('Updated Name');
      expect(updated.username).toBe('newusername');
      expect(updated.email).toBe(created.email); // Email unchanged
      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should update only specified fields', async () => {
      const userData = await UserFactory.build();
      const created = await drizzleUserRepository.create(userData);

      const updated = await drizzleUserRepository.update(created.id, {
        name: 'New Name Only',
      });

      expectNotNull(updated);
      expect(updated.name).toBe('New Name Only');
      expect(updated.email).toBe(created.email);
      expect(updated.username).toBe(created.username);
    });

    it('should return null for non-existent user', async () => {
      const updated = await drizzleUserRepository.update('non-existent-id', {
        name: 'New Name',
      });

      expect(updated).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const userData = await UserFactory.build();
      const created = await drizzleUserRepository.create(userData);
      const newHashedPassword = 'new-hashed-password-123';

      const updated = await drizzleUserRepository.updatePassword(created.id, newHashedPassword);

      expectNotNull(updated);
      expect(updated.hashedPassword).toBe(newHashedPassword);
      expect(updated.hashedPassword).not.toBe(created.hashedPassword);
    });

    it('should return null for non-existent user', async () => {
      const updated = await drizzleUserRepository.updatePassword('non-existent-id', 'new-password');

      expect(updated).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should soft delete user', async () => {
      const userData = await UserFactory.build();
      const created = await drizzleUserRepository.create(userData);

      await drizzleUserRepository.softDelete(created.id);

      // User should not be found by normal queries
      const foundById = await drizzleUserRepository.findById(created.id);
      const foundByEmail = await drizzleUserRepository.findByEmail(userData.email);

      expectSoftDeleted(foundById);
      expectSoftDeleted(foundByEmail);
    });

    it('should set deletedAt timestamp', async () => {
      const userData = await UserFactory.build();
      const created = await drizzleUserRepository.create(userData);
      const beforeDelete = new Date();

      await drizzleUserRepository.softDelete(created.id);

      // Direct DB query to verify deletedAt (bypassing repository filters)
      const { getTestDb } = await import('../setup');
      const db = getTestDb();
      const result = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, created.id),
      });

      expectNotNull(result);
      expectDeleted(result);
      expect(result.deletedAt!.getTime()).toBeGreaterThanOrEqual(beforeDelete.getTime());
    });
  });

  describe('Session Management', () => {
    describe('createSession', () => {
      it('should create a session for user', async () => {
        const userData = await UserFactory.build();
        const user = await drizzleUserRepository.create(userData);
        const expiresAt = futureTimestamp(3600); // 1 hour from now

        const session = await drizzleUserRepository.createSession(
          user.id,
          'test-token-123',
          expiresAt
        );

        expectDatabaseRow(session, {
          userId: user.id,
          token: 'test-token-123',
        });
        expectTimestampInFuture(session.expiresAt);
      });

      it('should create multiple sessions for same user', async () => {
        const userData = await UserFactory.build();
        const user = await drizzleUserRepository.create(userData);
        const expiresAt = futureTimestamp(3600);

        const session1 = await drizzleUserRepository.createSession(user.id, 'token-1', expiresAt);
        const session2 = await drizzleUserRepository.createSession(user.id, 'token-2', expiresAt);

        expect(session1.id).not.toBe(session2.id);
        expect(session1.token).not.toBe(session2.token);
        expect(session1.userId).toBe(session2.userId);
      });
    });

    describe('findSessionByToken', () => {
      it('should find session by token', async () => {
        const userData = await UserFactory.build();
        const user = await drizzleUserRepository.create(userData);
        const expiresAt = futureTimestamp(3600);
        const created = await drizzleUserRepository.createSession(
          user.id,
          'find-me-token',
          expiresAt
        );

        const found = await drizzleUserRepository.findSessionByToken('find-me-token');

        expectNotNull(found);
        expect(found.id).toBe(created.id);
        expect(found.token).toBe('find-me-token');
      });

      it('should return null for non-existent token', async () => {
        const found = await drizzleUserRepository.findSessionByToken('non-existent-token');

        expect(found).toBeNull();
      });

      it('should not return expired sessions', async () => {
        const userData = await UserFactory.build();
        const user = await drizzleUserRepository.create(userData);
        const expiredTime = pastTimestamp(3600); // 1 hour ago

        await drizzleUserRepository.createSession(user.id, 'expired-token', expiredTime);
        const found = await drizzleUserRepository.findSessionByToken('expired-token');

        expectSoftDeleted(found);
      });
    });

    describe('deleteSession', () => {
      it('should delete session by token', async () => {
        const userData = await UserFactory.build();
        const user = await drizzleUserRepository.create(userData);
        const expiresAt = futureTimestamp(3600);
        await drizzleUserRepository.createSession(user.id, 'delete-me-token', expiresAt);

        await drizzleUserRepository.deleteSession('delete-me-token');

        const found = await drizzleUserRepository.findSessionByToken('delete-me-token');
        expectSoftDeleted(found);
      });

      it('should not throw error deleting non-existent session', async () => {
        await expect(
          drizzleUserRepository.deleteSession('non-existent-token')
        ).resolves.not.toThrow();
      });
    });

    describe('deleteExpiredSessions', () => {
      it('should delete all expired sessions', async () => {
        const userData = await UserFactory.build();
        const user = await drizzleUserRepository.create(userData);
        const expiredTime = pastTimestamp(3600);
        const validTime = futureTimestamp(3600);

        // Create expired sessions
        await drizzleUserRepository.createSession(user.id, 'expired-1', expiredTime);
        await drizzleUserRepository.createSession(user.id, 'expired-2', expiredTime);
        // Create valid session
        await drizzleUserRepository.createSession(user.id, 'valid-session', validTime);

        await drizzleUserRepository.deleteExpiredSessions();

        // Expired sessions should be gone
        const expired1 = await drizzleUserRepository.findSessionByToken('expired-1');
        const expired2 = await drizzleUserRepository.findSessionByToken('expired-2');
        // Valid session should remain
        const valid = await drizzleUserRepository.findSessionByToken('valid-session');

        expectSoftDeleted(expired1);
        expectSoftDeleted(expired2);
        expectNotNull(valid);
      });

      it('should not delete valid sessions', async () => {
        const userData = await UserFactory.build();
        const user = await drizzleUserRepository.create(userData);
        const validTime = futureTimestamp(3600);

        await drizzleUserRepository.createSession(user.id, 'valid-token', validTime);
        await drizzleUserRepository.deleteExpiredSessions();

        const found = await drizzleUserRepository.findSessionByToken('valid-token');

        expectNotNull(found);
      });
    });

    describe('findUserBySessionToken', () => {
      it('should find user by valid session token', async () => {
        const userData = await UserFactory.build();
        const user = await drizzleUserRepository.create(userData);
        const expiresAt = futureTimestamp(3600);
        await drizzleUserRepository.createSession(user.id, 'user-lookup-token', expiresAt);

        const found = await drizzleUserRepository.findUserBySessionToken('user-lookup-token');

        expectNotNull(found);
        expect(found.id).toBe(user.id);
        expect(found.email).toBe(user.email);
      });

      it('should return null for non-existent session', async () => {
        const found = await drizzleUserRepository.findUserBySessionToken('non-existent-token');

        expect(found).toBeNull();
      });

      it('should return null for expired session', async () => {
        const userData = await UserFactory.build();
        const user = await drizzleUserRepository.create(userData);
        const expiredTime = pastTimestamp(3600);
        await drizzleUserRepository.createSession(user.id, 'expired-lookup-token', expiredTime);

        const found = await drizzleUserRepository.findUserBySessionToken('expired-lookup-token');

        expectSoftDeleted(found);
      });

      it('should not return soft-deleted user even with valid session', async () => {
        const userData = await UserFactory.build();
        const user = await drizzleUserRepository.create(userData);
        const expiresAt = futureTimestamp(3600);
        await drizzleUserRepository.createSession(user.id, 'deleted-user-token', expiresAt);

        // Soft delete the user
        await drizzleUserRepository.softDelete(user.id);

        const found = await drizzleUserRepository.findUserBySessionToken('deleted-user-token');

        expectSoftDeleted(found);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string updates', async () => {
      const userData = await UserFactory.build();
      const user = await drizzleUserRepository.create(userData);

      const updated = await drizzleUserRepository.update(user.id, {
        name: '',
      });

      expectNotNull(updated);
      expect(updated.name).toBe('');
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      const userData = await UserFactory.build({ email: longEmail });

      const user = await drizzleUserRepository.create(userData);

      expect(user.email).toBe(longEmail);
    });

    it('should maintain data integrity across concurrent creates', async () => {
      const users = await UserFactory.buildList(5);

      const created = await Promise.all(
        users.map((userData) => drizzleUserRepository.create(userData))
      );

      expect(created).toHaveLength(5);
      const uniqueIds = new Set(created.map((u) => u.id));
      expect(uniqueIds.size).toBe(5); // All IDs should be unique
    });
  });
});
