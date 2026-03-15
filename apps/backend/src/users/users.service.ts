import { Injectable } from '@nestjs/common';
import { db, drizzleUserRepository, users } from '@the-new-fuse/database';
import { desc, eq } from 'drizzle-orm';
import { EventBus } from '../events/event-bus.service';
import { LoggingService } from '../services/logging.service';
import { hashPassword } from '../utils/auth.utils';
import { UserCreatedEvent, UserDeletedEvent, UserUpdatedEvent } from './events/user.events';

@Injectable()
export class UsersService {
  constructor(
    private logger: LoggingService,
    private eventBus: EventBus
  ) {
    this.logger.setContext('UsersService');
  }

  async create(data: any) {
    const hashedPassword = await hashPassword(data.password);

    const user = await drizzleUserRepository.create({
      ...data,
      hashedPassword: hashedPassword,
    } as any);

    // Publish user created event with timestamp
    const event = new UserCreatedEvent(user);
    await this.eventBus.publish(event);

    return this.sanitizeUser(user);
  }

  async findAll(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    // Use Drizzle to fetch users with pagination and counts
    // For performance and to avoid cross-product issues with multiple joins,
    // we use subqueries or separate count queries.
    const allUsers = await db.query.users.findMany({
      limit: limit,
      offset: skip,
      orderBy: [desc(users.createdAt)],
      with: {
        agents: {
          columns: {
            id: true,
          },
        },
        workspaces: {
          columns: {
            id: true,
          },
        },
      },
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        isActive: true,
      },
    });

    const total = await drizzleUserRepository.count();
    const activeCount = await drizzleUserRepository.count({ isActive: true } as any);
    // Count all admin-related roles
    const adminCount =
      (await drizzleUserRepository.count({ role: 'ADMIN' } as any)) +
      (await drizzleUserRepository.count({ role: 'SUPER_ADMIN' } as any));

    const data = allUsers.map((user) => ({
      ...user,
      agentCount: user.agents?.length || 0,
      workspaceCount: user.workspaces?.length || 0,
      // Remove the full arrays to keep response payload small
      agents: undefined,
      workspaces: undefined,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total,
        active: activeCount,
        inactive: total - activeCount,
        admins: adminCount,
      },
    };
  }

  async findById(id: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        preferences: true,
      },
    });
    return user;
  }

  async findByEmail(email: string) {
    return db.query.users.findFirst({
      where: eq(users.email, email),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    });
  }

  async update(id: string, data: any) {
    const user = await drizzleUserRepository.update(id, data);

    if (user) {
      // Publish user updated event with timestamp
      const event = new UserUpdatedEvent(user);
      await this.eventBus.publish(event);
    }

    return user ? this.sanitizeUser(user) : null;
  }

  async delete(id: string) {
    await drizzleUserRepository.delete(id);

    // Publish user deleted event
    await this.eventBus.publish(new UserDeletedEvent(id));

    return { success: true };
  }

  sanitizeUser(user: any) {
    const { hashedPassword, password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async getProfile(id: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateProfile(id: string, profileData: any) {
    const user = await drizzleUserRepository.update(id, profileData);

    if (user) {
      this.logger.log(`Profile updated for user ${id}`);
    }

    return user;
  }
}
