import { PrismaService } from '@the-new-fuse/database';
import { User } from '@the-new-fuse/database/generated/prisma';
export declare class DatabaseService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    get client(): PrismaService;
    get llmConfigs(): any;
    findUser(where: {
        email: string;
    }): Promise<User | null>;
    deleteUserSessions(where: {
        userId: string;
    }): Promise<void>;
    createUser(data: {
        email: string;
        username: string;
        firstName?: string;
        lastName?: string;
    }): Promise<User>;
    updateUser(id: string, data: Partial<User>): Promise<User>;
    deleteUser(id: string): Promise<void>;
    findUserById(id: string): Promise<User | null>;
    health(): Promise<boolean>;
}
//# sourceMappingURL=database_service.d.ts.map