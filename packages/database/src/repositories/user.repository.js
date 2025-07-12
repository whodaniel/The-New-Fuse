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
import { PrismaService } from '../prisma.service';
let UserRepository = class UserRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapDatabaseUserToUser(dbUser) {
        return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name ?? null,
            passwordHash: dbUser.passwordHash,
            role: dbUser.role,
            createdAt: dbUser.createdAt,
            updatedAt: dbUser.updatedAt,
        };
    }
    getUserSelect() {
        return {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true,
            createdAt: true,
            updatedAt: true
        };
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: this.getUserSelect()
        });
        if (!user)
            return null;
        return this.mapDatabaseUserToUser(user);
    }
    async findByEmail(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: this.getUserSelect()
        });
        if (!user)
            return null;
        return this.mapDatabaseUserToUser(user);
    }
    async findMany(filters) {
        const users = await this.prisma.user.findMany({
            where: filters,
            select: this.getUserSelect(),
            orderBy: {
                createdAt: 'desc'
            }
        });
        return users.map(user => this.mapDatabaseUserToUser(user));
    }
    async create(data) {
        const user = await this.prisma.user.create({
            data,
            select: this.getUserSelect()
        });
        return this.mapDatabaseUserToUser(user);
    }
    async update(id, data) {
        const user = await this.prisma.user.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            },
            select: this.getUserSelect()
        });
        return this.mapDatabaseUserToUser(user);
    }
    async delete(id) {
        const user = await this.prisma.user.delete({
            where: { id },
            select: this.getUserSelect()
        });
        return this.mapDatabaseUserToUser(user);
    }
    async findByRole(role) {
        const users = await this.prisma.user.findMany({
            where: { role: role }, // Cast to any to handle enum type
            select: this.getUserSelect(),
            orderBy: {
                createdAt: 'desc'
            }
        });
        return users.map(user => this.mapDatabaseUserToUser(user));
    }
    async updatePassword(id, passwordHash) {
        const user = await this.prisma.user.update({
            where: { id },
            data: {
                passwordHash,
                updatedAt: new Date()
            },
            select: this.getUserSelect()
        });
        return this.mapDatabaseUserToUser(user);
    }
    async updateRole(id, role) {
        const user = await this.prisma.user.update({
            where: { id },
            data: {
                role,
                updatedAt: new Date()
            },
            select: this.getUserSelect()
        });
        return this.mapDatabaseUserToUser(user);
    }
    async searchUsers(query) {
        const users = await this.prisma.user.findMany({
            where: {
                OR: [
                    {
                        email: {
                            contains: query,
                            mode: 'insensitive'
                        }
                    },
                    {
                        name: {
                            contains: query,
                            mode: 'insensitive'
                        }
                    }
                ]
            },
            select: this.getUserSelect(),
            orderBy: {
                createdAt: 'desc'
            }
        });
        return users.map(user => this.mapDatabaseUserToUser(user));
    }
    async getUserStats() {
        const totalUsers = await this.prisma.user.count();
        const roleStats = await this.prisma.user.groupBy({
            by: ['role'],
            _count: {
                id: true
            }
        });
        const recentUsers = await this.prisma.user.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
            }
        });
        return {
            total: totalUsers,
            recent: recentUsers,
            byRole: roleStats.reduce((acc, { role, _count }) => {
                acc[role] = _count.id;
                return acc;
            }, {})
        };
    }
    async count(filters) {
        return this.prisma.user.count({
            where: filters
        });
    }
};
UserRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], UserRepository);
export { UserRepository };
