import { PrismaService } from '@the-new-fuse/database';
import { User } from '@the-new-fuse/types';
export declare class AuthService {
    private readonly prismaService;
    constructor(prismaService: PrismaService);
    private transformPrismaUser;
    validateUser(email: string, password: string): Promise<User | null>;
    createUser(data: {
        email: string;
        password: string;
        name?: string;
    }): Promise<User>;
    logout(userId: string): Promise<void>;
}
//# sourceMappingURL=authService.d.ts.map