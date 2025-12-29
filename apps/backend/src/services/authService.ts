import { Injectable } from '@nestjs/common';
import { drizzleUserRepository } from '@the-new-fuse/database';
import { User, UserRole } from '@the-new-fuse/types';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor() {}

  private transformUser(user: any): User {
    return {
      id: user.id,
      username: user.username || user.name || user.email.split('@')[0],
      email: user.email,
      displayName: user.displayName || user.name,
      avatarUrl: user.avatarUrl || user.avatar || user.picture,
      roles: Array.isArray(user.role)
        ? user.role
        : user.role
          ? [user.role.toUpperCase() as UserRole]
          : ['USER' as UserRole],
      isActive: user.isActive ?? user.emailVerified ?? true,
      lastLogin: user.lastLogin,
      authProvider: user.authProvider || (user.googleId ? 'google' : 'local'),
      authProviderId: user.authProviderId || user.googleId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await drizzleUserRepository.findByEmail(email);

    if (!user || !user.hashedPassword) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.hashedPassword);
    return isValid ? this.transformUser(user) : null;
  }

  async createUser(data: { email: string; password: string; name?: string }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await drizzleUserRepository.create({
      email: data.email,
      hashedPassword: hashedPassword,
      name: data.name,
      role: 'USER',
      emailVerified: false,
      username: data.email.split('@')[0], // Generate a default username if required
    } as Parameters<typeof drizzleUserRepository.create>[0]);
    return this.transformUser(user);
  }

  async logout(userId: string): Promise<void> {
    await drizzleUserRepository.deleteAllSessions(userId);
  }
}
