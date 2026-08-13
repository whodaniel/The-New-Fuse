// @ts-nocheck
/**
 * User DataLoader - Migrated to Drizzle ORM
 * Provides efficient batched loading of users for GraphQL resolvers
 */
import { Injectable, Scope } from '@nestjs/common';
import type { User } from '@the-new-fuse/database';
import { DatabaseService } from '@the-new-fuse/database';
import DataLoader from 'dataloader';

@Injectable({ scope: Scope.REQUEST })
export class UserLoader {
  private readonly batchUsers: DataLoader<string, User | null>;

  constructor(private readonly db: DatabaseService) {
    this.batchUsers = new DataLoader<string, User | null>(async (userIds: readonly string[]) => {
      const users = await this.db.users.findUsersByIds([...userIds]);
      const userMap = new Map(users.map((user) => [user.id, user]));
      return userIds.map((id) => userMap.get(id) || null);
    });
  }

  async load(userId: string): Promise<User | null> {
    return this.batchUsers.load(userId);
  }

  async loadMany(userIds: string[]): Promise<(User | null)[]> {
    return this.batchUsers.loadMany(userIds) as Promise<(User | null)[]>;
  }
}
