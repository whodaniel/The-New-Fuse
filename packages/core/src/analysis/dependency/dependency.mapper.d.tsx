import { PrismaService } from '../../database/prisma.service.js';
export declare class DependencyMapper {
    private readonly prisma;
    constructor(prisma: PrismaService);
    mapDependencies(): Promise<void>;
}
