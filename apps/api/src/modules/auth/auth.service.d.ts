import { AuthService as SecurityAuthService, HashingService } from '@the-new-fuse/security';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService extends SecurityAuthService {
    constructor(prisma: PrismaService, hashingService: HashingService);
}
//# sourceMappingURL=auth.service.d.ts.map