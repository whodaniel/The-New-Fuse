var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
import { Injectable } from '@nestjs/common';
import { UsersService } from '../modules/users/users.service';
import { EventBus } from '../events/event-bus.service';
import { LoggingService } from '../services/logging.service';
// import { EmailService } from '../services/email.service';
import { PrismaService } from '@the-new-fuse/database';
let NotificationService = class NotificationService {
    usersService;
    eventBus;
    logger;
    prisma;
    constructor(usersService, eventBus, logger, 
    // private emailService: EmailService,
    prisma) {
        this.usersService = usersService;
        this.eventBus = eventBus;
        this.logger = logger;
        this.prisma = prisma;
    }
    async sendNotification(userId, type, title, message) {
        await this.prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message
            }
        });
        // Log notification sent
        this.logger.info(`Notification sent to user ${userId}: ${type}`, { userId, type });
    }
    async getUserNotifications(userId) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    }
    async markAsRead(userId, notificationId) {
        return this.prisma.notification.update({
            where: { id: notificationId, userId },
            data: { read: true }
        });
    }
};
NotificationService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof UsersService !== "undefined" && UsersService) === "function" ? _a : Object, typeof (_b = typeof EventBus !== "undefined" && EventBus) === "function" ? _b : Object, typeof (_c = typeof LoggingService !== "undefined" && LoggingService) === "function" ? _c : Object, typeof (_d = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _d : Object])
], NotificationService);
export { NotificationService };
//# sourceMappingURL=notification.service.js.map