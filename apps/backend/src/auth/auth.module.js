"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const config_1 = require("@nestjs/config");
const roles_guard_1 = require("./guards/roles.guard");
const firebase_auth_guard_1 = require("./firebase-auth.guard");
const agent_jwt_strategy_1 = require("./agent-jwt.strategy");
const users_service_1 = require("../users/users.service");
const logging_service_1 = require("../services/logging.service");
const event_bus_service_1 = require("../events/event-bus.service");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            config_1.ConfigModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'your-secret-key',
                signOptions: { expiresIn: '7d' },
            }),
        ],
        providers: [
            auth_service_1.AuthService,
            users_service_1.UsersService,
            logging_service_1.LoggingService,
            event_bus_service_1.EventBus,
            roles_guard_1.RolesGuard,
            firebase_auth_guard_1.FirebaseAuthGuard,
            agent_jwt_strategy_1.AgentJwtStrategy,
        ],
        controllers: [auth_controller_1.AuthController],
        exports: [auth_service_1.AuthService, roles_guard_1.RolesGuard, firebase_auth_guard_1.FirebaseAuthGuard, agent_jwt_strategy_1.AgentJwtStrategy],
    })
], AuthModule);
