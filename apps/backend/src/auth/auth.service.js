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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const logging_service_1 = require("../services/logging.service");
const auth_utils_1 = require("../utils/auth.utils");
const event_bus_service_1 = require("../events/event-bus.service");
const auth_events_1 = require("./events/auth.events");
let AuthService = class AuthService {
    usersService;
    jwtService;
    logger;
    eventBus;
    constructor(usersService, jwtService, logger, eventBus) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.logger = logger;
        this.eventBus = eventBus;
    }
    async validateUser(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (user && await (0, auth_utils_1.comparePasswords)(password, user.password)) {
            await this.eventBus.publish(new auth_events_1.UserLoginEvent(user));
            return user;
        }
        return null;
    }
    async login(user) {
        const payload = { email: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        };
    }
    async register(email, password, name) {
        // Check if user already exists
        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        // Create user (password will be hashed in UsersService)
        const user = await this.usersService.create({
            email,
            password,
            name,
        });
        // Generate JWT token
        const payload = { email: user.email, sub: user.id };
        const access_token = this.jwtService.sign(payload);
        return {
            access_token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        };
    }
    async authenticate(firebaseToken) {
        // Firebase authentication logic - simplified for now
        // In production, verify the Firebase token
        return { message: 'Firebase authentication not implemented yet' };
    }
    async logout(token) {
        // Token invalidation logic
        return { message: 'Logged out successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        logging_service_1.LoggingService,
        event_bus_service_1.EventBus])
], AuthService);
//# sourceMappingURL=auth.service.js.map