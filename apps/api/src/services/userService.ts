/**
 * UserService - Migrated to Drizzle ORM
 * Handles user CRUD operations
 */
import { Injectable } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DatabaseService, User } from '@the-new-fuse/database';

@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}

  async findAll(): Promise<User[]> {
    return this.db.users.findAll();
  }

  async findOne(id: string): Promise<User | null> {
    return this.db.users.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.users.findByEmail(email);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.db.users.findByUsername(username);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.findByEmail(email);
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return this.findByUsername(username);
  }

  async createUser(email: string, hashedPassword: string, username: string): Promise<User> {
    return this.db.users.create({
      email,
      hashedPassword,
      username,
      role: 'USER',
    });
  }

  async getUserProfileById(userId: string): Promise<User | null> {
    return this.findOne(userId);
  }

  async updateUserProfileById(userId: string, profileData: Partial<User>): Promise<User | null> {
    try {
      return await this.update(userId, profileData);
    } catch (error) {
      return null;
    }
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    // Remove any readonly/computed fields
    const { id: _id, createdAt, ...updateData } = data as any;
    return this.db.users.update(id, {
      ...updateData,
      updatedAt: new Date(),
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.db.users.softDelete(id);
  }
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  preferences?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
