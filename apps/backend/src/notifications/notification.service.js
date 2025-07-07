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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const event_bus_service_1 = require("../events/event-bus.service");
const logging_service_1 = require("../services/logging.service");
const email_service_1 = require("../services/email.service");
const notification_events_1 = require("./events/notification.events");
let NotificationService = class NotificationService {
    usersService;
    eventBus;
    logger;
    emailService;
    constructor(usersService, eventBus, logger, emailService) {
        this.usersService = usersService;
        this.eventBus = eventBus;
        this.logger = logger;
        this.emailService = emailService;
    }
    async sendNotification(userId, type, data) {
        const user = await this.usersService.findOne(userId);
        await this.prisma.notification.create({
            data: {
                userId: user.id,
                type,
                data,
                read: false
            }
        });
        if (user.emailNotifications) {
            await this.emailService.sendEmail(user.email, type, data);
        }
        await this.eventBus.publish(new notification_events_1.NotificationSentEvent(user, type, data));
        this.logger.info(`Notification sent to user ${userId}: ${type}`);
    }
    async getUserNotifications(userId) {
        await this.usersService.findOne(userId); // Verify user exists
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
        logging_service_1.LoggingService, typeof (_a = typeof email_service_1.EmailService !== "undefined" && email_service_1.EmailService) === "function" ? _a : Object])
], NotificationService);
