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
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../services/redis.service';
let UsersService = UsersService_1 = class UsersService {
    prisma;
    redisService;
    logger = new Logger(UsersService_1.name);
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
    }
    async findOne(id) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async create(userData) {
        return this.prisma.user.create({
            data: userData,
        });
    }
    async update(id, userData) {
        return this.prisma.user.update({
            where: { id },
            data: userData,
        });
    }
    async delete(id) {
        return this.prisma.user.delete({
            where: { id },
        });
    }
    async findAll() {
        return this.prisma.user.findMany();
    }
};
UsersService = UsersService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object, typeof (_b = typeof RedisService !== "undefined" && RedisService) === "function" ? _b : Object])
], UsersService);
export { UsersService };
//# sourceMappingURL=user.service.js.map