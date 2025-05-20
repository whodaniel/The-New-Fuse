import { PrismaService } from '../database/prisma.service.js';
export declare class TaskRepository {
    private prisma;
    constructor(prisma: PrismaService);
    createTask(): Promise<void>;
}
