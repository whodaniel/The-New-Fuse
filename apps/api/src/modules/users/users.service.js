var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UsersService_1;
var _a, _b;
import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '../../events/event-bus.service';
import { UserCreatedEvent, UserUpdatedEvent, UserDeletedEvent } from './events/user.events';
import { hashPassword } from '../utils/auth.utils';
import { PrismaService } from '@the-new-fuse/database';
let UsersService = UsersService_1 = class UsersService {
    prisma;
    eventBus;
    logger = new Logger(UsersService_1.name);
    constructor(prisma, eventBus) {
        this.prisma = prisma;
        this.eventBus = eventBus;
    }
    async create(data) {
        const hashedPassword = await hashPassword(data.password);
        const user = await this.prisma.user.create({
            data: {
                ...data,
                hashedPassword,
                password: undefined // Remove password field, use hashedPassword
            }
        });
        // Publish user created event with timestamp
        const authenticatedUser = {
            id: user.id,
            email: user.email,
            username: user.username || user.email,
            displayName: user.name || user.username,
            roles: ['USER'],
            isActive: true,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        const event = new UserCreatedEvent(authenticatedUser);
        await this.eventBus.publish(event);
        return this.sanitizeUser(user);
    }
    async findAll() {
        const users = await this.prisma.user.findMany({});
        return users.map(user => this.sanitizeUser(user));
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        return user ? this.sanitizeUser(user) : null;
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        return user ? this.sanitizeUser(user) : null;
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }
    async update(id, data) {
        const user = await this.prisma.user.update({
            where: { id },
            data
        });
        // Publish user updated event with timestamp
        const authenticatedUser = {
            id: user.id,
            email: user.email,
            username: user.username || user.email,
            displayName: user.name || user.username,
            updatedAt: user.updatedAt,
        };
        const event = new UserUpdatedEvent(authenticatedUser);
        await this.eventBus.publish(event);
        return this.sanitizeUser(user);
    }
    async delete(id) {
        await this.prisma.user.delete({ where: { id } });
        // Publish user deleted event
        await this.eventBus.publish(new UserDeletedEvent(id));
        return { success: true };
    }
    sanitizeUser(user) {
        const { ...sanitizedUser } = user;
        delete sanitizedUser.password;
        return sanitizedUser;
    }
};
UsersService = UsersService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object, typeof (_b = typeof EventBus !== "undefined" && EventBus) === "function" ? _b : Object])
], UsersService);
export { UsersService };
//# sourceMappingURL=users.service.js.map