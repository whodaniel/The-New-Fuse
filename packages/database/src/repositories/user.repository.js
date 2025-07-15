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
exports.UserRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let UserRepository = class UserRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapDatabaseUserToUser(dbUser) {
        return {
            id: dbUser.id,
            email: dbUser.email,
            username: dbUser.username,
            name: dbUser.name,
            hashedPassword: dbUser.hashedPassword,
            role: dbUser.role,
            roles: dbUser.roles,
            isActive: dbUser.isActive,
            lastLogin: dbUser.lastLogin,
            preferences: dbUser.preferences,
            refreshToken: dbUser.refreshToken,
            createdAt: dbUser.createdAt,
            updatedAt: dbUser.updatedAt,
            deletedAt: dbUser.deletedAt,
        };
    }
    getUserSelect() {
        return {
            id: true,
            email: true,
            username: true,
            name: true,
            hashedPassword: true,
            role: true,
            roles: true,
            isActive: true,
            lastLogin: true,
            preferences: true,
            refreshToken: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true
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
    async updatePassword(id, hashedPassword) {
        const user = await this.prisma.user.update({
            where: { id },
            data: {
                hashedPassword,
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
exports.UserRepository = UserRepository;
exports.UserRepository = UserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserRepository);
