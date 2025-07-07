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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const logging_service_1 = require("../services/logging.service");
const event_bus_service_1 = require("../events/event-bus.service");
const user_events_1 = require("./events/user.events");
const auth_utils_1 = require("../utils/auth.utils");
let UsersService = class UsersService {
    prisma;
    logger;
    eventBus;
    constructor(prisma, logger, eventBus) {
        this.prisma = prisma;
        this.logger = logger;
        this.eventBus = eventBus;
        this.logger.setContext('UsersService');
    }
    async create(data) {
        const hashedPassword = await (0, auth_utils_1.hashPassword)(data.password);
        const user = await this.prisma.user.create({
            data: {
                ...data,
                password: hashedPassword
            }
        });
        // Publish user created event with timestamp
        const event = new user_events_1.UserCreatedEvent(user);
        await this.eventBus.publish(event);
        return this.sanitizeUser(user);
    }
    async findAll() {
        const users = await this.prisma.user.findMany();
        return users.map(user => this.sanitizeUser(user));
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
        const event = new user_events_1.UserUpdatedEvent(user);
        await this.eventBus.publish(event);
        return this.sanitizeUser(user);
    }
    async delete(id) {
        await this.prisma.user.delete({ where: { id } });
        // Publish user deleted event
        await this.eventBus.publish(new user_events_1.UserDeletedEvent(id));
        return { success: true };
    }
    sanitizeUser(user) {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logging_service_1.LoggingService,
        event_bus_service_1.EventBus])
], UsersService);
