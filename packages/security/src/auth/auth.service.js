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
var AuthService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const database_1 = require("@the-new-fuse/database");
const bcrypt = __importStar(require("bcrypt"));
const mfa_service_1 = require("../mfa/mfa.service");
const audit_integration_service_1 = require("../audit-logging/audit-integration.service");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    configService;
    mfaService;
    auditService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService, configService, mfaService, auditService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.mfaService = mfaService;
        this.auditService = auditService;
    }
    async register(registerDto, request) {
        try {
            const { email, password, firstName, lastName } = registerDto;
            // Check if user already exists
            const existingUser = await this.prisma.user.findUnique({
                where: { email },
            });
            if (existingUser) {
                this.auditService.logFailedLogin(email, request, 'User already exists');
                throw new common_1.ConflictException('User with this email already exists');
            }
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            // Create user
            const user = await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: `${firstName} ${lastName}`,
                    role: 'USER',
                    isActive: true,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    username: true,
                    role: true,
                },
            });
            // Generate tokens
            const tokens = await this.generateTokens(user.id, user.email);
            this.auditService.logLogin(user.id, request);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    username: user.username,
                    roles: [user.role],
                },
                tokens,
            };
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error; // Re-throw known exceptions
            }
            this.logger.error('Failed to register user', error instanceof Error ? error.stack : String(error));
            throw new common_1.BadRequestException('Registration failed');
        }
    }
    async login(loginDto, request) {
        try {
            const { email, password, mfaToken } = loginDto;
            // Find user
            const user = await this.prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    name: true,
                    username: true,
                    role: true,
                    isActive: true,
                },
            });
            if (!user || !user.isActive) {
                this.auditService.logFailedLogin(email, request, 'User not found or inactive');
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password || '');
            if (!isPasswordValid) {
                this.auditService.logFailedLogin(email, request, 'Invalid password');
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            // Verify MFA if enabled (defaulting to false since it's not in schema)
            const mfaEnabled = false; // TODO: Add MFA support when schema is updated
            if (mfaEnabled) {
                if (!mfaToken) {
                    throw new common_1.BadRequestException('MFA token required');
                }
                const isMfaValid = await this.mfaService.verifyMfaToken(user.id, mfaToken);
                if (!isMfaValid) {
                    this.auditService.logMfaFailed(user.id, request);
                    throw new common_1.UnauthorizedException('Invalid MFA token');
                }
            }
            // Generate tokens
            const tokens = await this.generateTokens(user.id, user.email);
            this.auditService.logLogin(user.id, request);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    username: user.username,
                    roles: [user.role],
                    mfaEnabled: mfaEnabled,
                },
                tokens,
            };
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException || error instanceof common_1.BadRequestException) {
                throw error; // Re-throw known exceptions
            }
            this.logger.error('Failed to login user', error instanceof Error ? error.stack : String(error));
            throw new common_1.UnauthorizedException('Login failed');
        }
    }
    async refreshTokens(refreshToken, request) {
        try {
            const payload = this.jwtService.verify(refreshToken);
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                select: { id: true, email: true, isActive: true },
            });
            if (!user || !user.isActive) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            return this.generateTokens(user.id, user.email);
        }
        catch (error) {
            this.logger.error('Failed to refresh tokens', error instanceof Error ? error.stack : String(error));
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(userId, request) {
        this.auditService.logLogout(userId, request);
    }
    async generateTokens(userId, email) {
        const payload = { sub: userId, email };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('security.jwt.expiresIn', '1h'),
        });
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('security.jwt.refreshExpiresIn', '7d'),
        });
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof database_1.PrismaService !== "undefined" && database_1.PrismaService) === "function" ? _a : Object, jwt_1.JwtService,
        config_1.ConfigService,
        mfa_service_1.MfaService,
        audit_integration_service_1.AuthAuditIntegrationService])
], AuthService);
//# sourceMappingURL=auth.service.js.map