"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const event_bus_service_1 = require("../events/event-bus.service");
const logging_service_1 = require("../services/logging.service");
const email_service_1 = require("../services/email.service");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationService = class NotificationService {
    usersService;
    eventBus;
    logger;
    emailService;
    prisma;
    constructor(usersService, eventBus, logger, emailService, prisma) {
        this.usersService = usersService;
        this.eventBus = eventBus;
        this.logger = logger;
        this.emailService = emailService;
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
        console.log(`Notification sent to user ${userId}: ${type}`);
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
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        event_bus_service_1.EventBus,
        logging_service_1.LoggingService,
        email_service_1.EmailService,
        prisma_service_1.PrismaService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map