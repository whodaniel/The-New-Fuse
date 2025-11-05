import { INestApplication, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@the-new-fuse/database/generated/prisma';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    enableShutdownHooks(app: INestApplication): Promise<void>;
}
//# sourceMappingURL=prisma.service.d.ts.map