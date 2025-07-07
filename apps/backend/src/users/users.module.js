"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const users_controller_1 = require("./users.controller");
const users_service_1 = require("./users.service");
const prisma_service_1 = require("../prisma/prisma.service");
const logging_service_1 = require("../services/logging.service");
const event_bus_service_1 = require("../events/event-bus.service");
const auth_module_1 = require("../auth/auth.module");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [users_controller_1.UsersController],
        providers: [
            users_service_1.UsersService,
            prisma_service_1.PrismaService,
            logging_service_1.LoggingService,
            event_bus_service_1.EventBus
        ],
        exports: [users_service_1.UsersService],
    })
], UsersModule);
