import { PrismaService } from './prisma.service';
import { User } from '@the-new-fuse/database/generated/prisma';
export declare class AuthService {
    private prisma;
    constructor(prisma: PrismaService);
    register({ name, email, password }: {
        name: string;
        email: string;
        password: string;
    }): Promise<{
        user: any;
        accessToken: string;
        refreshToken: string;
    }>;
    login({ email, password }: {
        email: string;
        password: string;
    }): Promise<{
        user: any;
        accessToken: string;
        refreshToken: string;
    }>;
    getCurrentUser(userId: string): Promise<User>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
}
//# sourceMappingURL=authService.d.ts.map