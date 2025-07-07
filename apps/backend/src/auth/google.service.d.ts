import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class GoogleAuthService {
    private configService;
    private prisma;
    private jwtService;
    private oauth2Client;
    constructor(configService: ConfigService, prisma: PrismaService, jwtService: JwtService);
    handleCallback(code: string): Promise<{
        token: string;
        user: {
            name: string | null;
            email: string;
            password: string | null;
            role: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            googleId: string | null;
            avatar: string | null;
            picture: string | null;
            emailVerified: boolean;
        };
    }>;
}
