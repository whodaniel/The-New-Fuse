import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoggingService } from '../services/logging.service.js';
import { EventBus } from '../events/event-bus.service.js';
import { UserCreatedEvent, UserUpdatedEvent, UserDeletedEvent } from './events/user.events.js';
import { hashPassword } from '../utils/auth.utils.js';

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

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map(user => this.sanitizeUser(user));
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.sanitizeUser(user) : null;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
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
}
