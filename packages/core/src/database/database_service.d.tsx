import { PrismaService } from '@the-new-fuse/database';
export declare class DatabaseService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    get client(): PrismaService;
    findUser(): Promise<void>;
}
