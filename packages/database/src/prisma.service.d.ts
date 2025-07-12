import { INestApplication, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    enableShutdownHooks(app: INestApplication): Promise<void>;
    get task(): import("../generated/prisma").Prisma.TaskDelegate<import("packages/database/generated/prisma/runtime/library").DefaultArgs, import("../generated/prisma").Prisma.PrismaClientOptions>;
    get agent(): import("../generated/prisma").Prisma.AgentDelegate<import("packages/database/generated/prisma/runtime/library").DefaultArgs, import("../generated/prisma").Prisma.PrismaClientOptions>;
    get user(): import("../generated/prisma").Prisma.UserDelegate<import("packages/database/generated/prisma/runtime/library").DefaultArgs, import("../generated/prisma").Prisma.PrismaClientOptions>;
    get message(): import("../generated/prisma").Prisma.MessageDelegate<import("packages/database/generated/prisma/runtime/library").DefaultArgs, import("../generated/prisma").Prisma.PrismaClientOptions>;
    get workflow(): import("../generated/prisma").Prisma.WorkflowDelegate<import("packages/database/generated/prisma/runtime/library").DefaultArgs, import("../generated/prisma").Prisma.PrismaClientOptions>;
    get workflowExecution(): import("../generated/prisma").Prisma.WorkflowExecutionDelegate<import("packages/database/generated/prisma/runtime/library").DefaultArgs, import("../generated/prisma").Prisma.PrismaClientOptions>;
}
//# sourceMappingURL=prisma.service.d.ts.map