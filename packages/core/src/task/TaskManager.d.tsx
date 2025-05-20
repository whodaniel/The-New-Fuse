import { PrismaService } from '@the-new-fuse/database';
export declare class TaskManager {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createTask(): Promise<void>;
}
