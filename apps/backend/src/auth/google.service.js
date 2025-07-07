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
exports.GoogleAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const google_auth_library_1 = require("google-auth-library");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
let GoogleAuthService = class GoogleAuthService {
    configService;
    prisma;
    jwtService;
    oauth2Client;
    constructor(configService, prisma, jwtService) {
        this.configService = configService;
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.oauth2Client = new google_auth_library_1.OAuth2Client(configService.get('GOOGLE_CLIENT_ID'), configService.get('GOOGLE_CLIENT_SECRET'), configService.get('GOOGLE_REDIRECT_URI'));
    }
    async handleCallback(code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        const ticket = await this.oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: this.configService.get('GOOGLE_CLIENT_ID'),
        });
        const payload = ticket.getPayload();
        // Find or create user
        const user = await this.prisma.user.upsert({
            where: { email: payload.email },
            update: {
                name: payload.name,
                picture: payload.picture,
            },
            create: {
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                role: 'USER',
            },
        });
        // Generate JWT
        const jwt = this.jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        return { token: jwt, user };
    }
};
exports.GoogleAuthService = GoogleAuthService;
exports.GoogleAuthService = GoogleAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        jwt_1.JwtService])
], GoogleAuthService);
