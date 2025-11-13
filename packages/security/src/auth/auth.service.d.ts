import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@the-new-fuse/database';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MfaService } from '../mfa/mfa.service';
import { AuthAuditIntegrationService } from '../audit-logging/audit-integration.service';
import { Request } from 'express';
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface LoginResponse {
    user: {
        id: string;
        email: string;
        name: string | null;
        username: string | null;
        roles: string[];
        mfaEnabled?: boolean;
    };
    tokens: AuthTokens;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly mfaService;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, mfaService: MfaService, auditService: AuthAuditIntegrationService);
    register(registerDto: RegisterDto, request: Request): Promise<LoginResponse>;
    login(loginDto: LoginDto, request: Request): Promise<LoginResponse>;
    refreshTokens(refreshToken: string, request: Request): Promise<AuthTokens>;
    logout(userId: string, request: Request): Promise<void>;
    private generateTokens;
}
//# sourceMappingURL=auth.service.d.ts.map