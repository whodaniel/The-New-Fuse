var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
let DatabaseService = class DatabaseService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    get client() {
        return this.prisma;
    }
    get llmConfigs() {
        return this.prisma.lLMConfig;
    }
    async findUser(where) {
        return this.prisma.user.findUnique({ where });
    }
    async deleteUserSessions(where) {
        await this.prisma.authSession.deleteMany({ where });
    }
    async createUser(data) {
        return this.prisma.user.create({ data });
    }
    async updateUser(id, data) {
        return this.prisma.user.update({
            where: { id },
            data
        });
    }
    async deleteUser(id) {
        await this.prisma.user.delete({ where: { id } });
    }
    async findUserById(id) {
        return this.prisma.user.findUnique({ where: { id } });
    }
    async health() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            return false;
        }
    }
};
DatabaseService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], DatabaseService);
export { DatabaseService };
