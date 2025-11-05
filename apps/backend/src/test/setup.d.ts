import { PrismaService } from '../prisma/prisma.service';
export declare function setupTestModule(): Promise<import("@nestjs/testing").TestingModule>;
export declare function setupTestDatabase(): Promise<PrismaService>;
export declare function teardownTestDatabase(prisma: PrismaService): Promise<void>;
//# sourceMappingURL=setup.d.ts.map