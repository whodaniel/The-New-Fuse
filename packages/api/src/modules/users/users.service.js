var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
import { Injectable } from '@nestjs/common';
import { LoggingService } from '../../services/logging.service';
import { EventBus } from '../events/event-bus.service';
let UsersService = class UsersService {
    logger;
    eventBus;
    users = new Map();
    constructor(logger, eventBus) {
        this.logger = logger;
        this.eventBus = eventBus;
    }
    async createUser(createUserDto) {
        const { email, name } = createUserDto;
        // Check if user already exists
        const existingUser = Array.from(this.users.values()).find(u => u.email === email);
        if (existingUser) {
            throw new Error('User already exists');
        }
        const user = {
            id: this.generateId(),
            email,
            name,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.users.set(user.id, user);
        this.logger.info(`User created: ${email}, { userId: user.id });
    this.eventBus.emit({
      id: this.generateId(),
      type: 'user.created',
      timestamp: new Date(),
      data: { userId: user.id, email },
    });

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    return user || null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
`, this.logger.info(`User updated: ${user.email}` `, { userId: id });
    return updatedUser;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}));
    }
};
UsersService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof LoggingService !== "undefined" && LoggingService) === "function" ? _a : Object, typeof (_b = typeof EventBus !== "undefined" && EventBus) === "function" ? _b : Object])
], UsersService);
export { UsersService };
//# sourceMappingURL=users.service.js.map