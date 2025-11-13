import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@the-new-fuse/database';
export declare class MfaService {
    private readonly prisma;
    private readonly configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    generateMfaSecret(userId: string, email: string): Promise<{
        secret: string;
        qrCode: void & Promise<string>;
    }>;
    verifyMfaToken(userId: string, token: string): Promise<boolean>;
    enableMfa(userId: string, token: string): Promise<boolean>;
    disableMfa(userId: string): Promise<void>;
    isMfaEnabled(userId: string): Promise<boolean>;
}
//# sourceMappingURL=mfa.service.d.ts.map