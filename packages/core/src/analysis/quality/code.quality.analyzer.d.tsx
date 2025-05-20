import { PrismaService } from '../../database/prisma.service.js';
export declare class CodeQualityAnalyzer {
    private readonly prisma;
    constructor(prisma: PrismaService);
    analyzeCode(): Promise<void>;
}
