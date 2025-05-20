import { PrismaClient } from '@the-new-fuse/database/client';
export declare class TaskService {
    private readonly logger;
    private readonly prisma;
    constructor(prisma: PrismaClient);
}
