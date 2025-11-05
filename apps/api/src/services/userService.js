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
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
let UserService = class UserService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.user.findMany();
    }
    async findOne(id) {
        return this.prisma.user.findUnique({
            where: { id }
        });
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email }
        });
    }
    async findByUsername(username) {
        return this.prisma.user.findUnique({
            where: { username }
        });
    }
    async findUserByEmail(email) {
        return this.findByEmail(email);
    }
    async findUserByUsername(username) {
        return this.findByUsername(username);
    }
    async createUser(email, hashedPassword, username) {
        return this.prisma.user.create({
            data: {
                email,
                hashedPassword,
                username,
                role: 'USER',
                // Add other required fields if any, based on your schema.prisma
            },
        });
    }
    async getUserProfileById(userId) {
        return this.findOne(userId);
    }
    async updateUserProfileById(userId, profileData) {
        try {
            return await this.update(userId, profileData);
        }
        catch (error) {
            return null;
        }
    }
    async update(id, data) {
        return this.prisma.user.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            }
        });
    }
    async delete(id) {
        return this.prisma.user.delete({
            where: { id }
        });
    }
};
UserService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object])
], UserService);
export { UserService };
//# sourceMappingURL=userService.js.map