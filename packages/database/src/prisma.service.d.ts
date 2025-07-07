import { INestApplication, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    enableShutdownHooks(app: INestApplication): Promise<void>;
    get task(): import("@prisma/client").Prisma.TaskDelegate<import(".prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get agent(): import("@prisma/client").Prisma.AgentDelegate<import(".prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get user(): import("@prisma/client").Prisma.UserDelegate<import(".prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get message(): import("@prisma/client").Prisma.MessageDelegate<import(".prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get workflow(): import("@prisma/client").Prisma.WorkflowDelegate<import(".prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get workflowExecution(): import("@prisma/client").Prisma.WorkflowExecutionDelegate<import(".prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
//# sourceMappingURL=prisma.service.d.ts.map