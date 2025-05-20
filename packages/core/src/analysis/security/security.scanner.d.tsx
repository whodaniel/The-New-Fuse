import { PrismaService } from '../../database/prisma.service.js';
export declare class SecurityScanner {
    private readonly prisma;
    constructor(prisma: PrismaService);
    scanProject(): Promise<void>;
}
