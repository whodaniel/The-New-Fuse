import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggingService } from '../services/logging.service';
import { EventBus } from '../events/event-bus.service';
import { UserCreatedEvent, UserUpdatedEvent, UserDeletedEvent } from './events/user.events';
import { hashPassword } from '../utils/auth.utils';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggingService,
    private eventBus: EventBus
  ) {
    this.logger.setContext('UsersService');
  }

  async create(data: any) {
    const hashedPassword = await hashPassword(data.password);
    
    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword
      }
    });

    // Publish user created event with timestamp
    const event = new UserCreatedEvent(user);
    await this.eventBus.publish(event);
    
    return this.sanitizeUser(user);
  }

  async findAll(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    // Use select to fetch only needed fields for better performance
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          emailVerified: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
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
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    });
  }

  async update(id: string, data: any) {
    const user = await this.prisma.user.update({
      where: { id },
      data
    });

    // Publish user updated event with timestamp
    const event = new UserUpdatedEvent(user);
    await this.eventBus.publish(event);
    
    return this.sanitizeUser(user);
  }

  async delete(id: string) {
    await this.prisma.user.delete({ where: { id } });
    
    // Publish user deleted event
    await this.eventBus.publish(new UserDeletedEvent(id));
    
    return { success: true };
  }

  sanitizeUser(user: any) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        // Add profile fields if they exist in your schema
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateProfile(id: string, profileData: any) {
    const user = await this.prisma.user.update({
      where: { id },
      data: profileData,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    this.logger.log(`Profile updated for user ${id}`);
    return user;
  }
}
