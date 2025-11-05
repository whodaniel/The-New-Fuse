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
        user: any;
    }>;
}
//# sourceMappingURL=google.service.d.ts.map