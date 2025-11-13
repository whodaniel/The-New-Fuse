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
exports.RbacService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
let RbacService = class RbacService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async hasPermission(userId, permission) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                roles: true,
            },
        });
        if (!user) {
            return false;
        }
        const rolePermissions = await this.prisma.role.findMany({
            where: {
                name: {
                    in: user.roles,
                },
            },
            select: {
                permissions: true,
            },
        });
        const userPermissions = rolePermissions.flatMap((role) => role.permissions);
        return userPermissions.includes(permission);
    }
    async hasRole(userId, role) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                roles: true,
            },
        });
        return user?.roles.includes(role) ?? false;
    }
    async getUserRoles(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                roles: true,
            },
        });
        return user?.roles ?? [];
    }
    async getUserPermissions(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                roles: true,
            },
        });
        if (!user) {
            return [];
        }
        const rolePermissions = await this.prisma.role.findMany({
            where: {
                name: {
                    in: user.roles,
                },
            },
            select: {
                permissions: true,
            },
        });
        return [...new Set(rolePermissions.flatMap((role) => role.permissions))];
    }
};
exports.RbacService = RbacService;
exports.RbacService = RbacService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof database_1.PrismaService !== "undefined" && database_1.PrismaService) === "function" ? _a : Object])
], RbacService);
//# sourceMappingURL=rbac.service.js.map