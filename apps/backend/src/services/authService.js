"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    prismaService;
    constructor(prismaService) {
        this.prismaService = prismaService;
    }
    transformPrismaUser(prismaUser) {
        return {
            id: prismaUser.id,
            username: prismaUser.name || prismaUser.email.split('@')[0],
            email: prismaUser.email,
            displayName: prismaUser.name,
            avatarUrl: prismaUser.avatar || prismaUser.picture,
            roles: [prismaUser.role?.toLowerCase()] || ['user'],
            isActive: prismaUser.emailVerified ?? true,
            lastLogin: null,
            authProvider: prismaUser.googleId ? 'google' : 'local',
            authProviderId: prismaUser.googleId,
            createdAt: prismaUser.createdAt,
            updatedAt: prismaUser.updatedAt
        };
    }
    async validateUser(email, password) {
        const prismaUser = await this.prismaService.user.findUnique({
            where: { email }
        });
        if (!prismaUser || !prismaUser.password) {
            return null;
        }
        const isValid = await bcrypt.compare(password, prismaUser.password);
        return isValid ? this.transformPrismaUser(prismaUser) : null;
    }
    async createUser(data) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const prismaUser = await this.prismaService.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role: 'user',
                emailVerified: false
            }
        });
        return this.transformPrismaUser(prismaUser);
    }
    async logout(userId) {
        // TODO: Implement session management when session model is added to Prisma schema
        // await this.prismaService.session.deleteMany({ 
        //   where: { userId } 
        // });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof database_1.PrismaService !== "undefined" && database_1.PrismaService) === "function" ? _a : Object])
], AuthService);
//# sourceMappingURL=authService.js.map