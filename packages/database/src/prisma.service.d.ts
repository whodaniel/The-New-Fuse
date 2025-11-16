import { INestApplication, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    enableShutdownHooks(app: INestApplication): Promise<void>;
    get task(): import("../generated/prisma").Prisma.TaskDelegate<import("../generated/prisma/runtime/library").DefaultArgs, import("../generated/prisma").Prisma.PrismaClientOptions>;
    get agent(): import("../generated/prisma").Prisma.AgentDelegate<import("../generated/prisma/runtime/library").DefaultArgs, import("../generated/prisma").Prisma.PrismaClientOptions>;
    get user(): import("../generated/prisma").Prisma.UserDelegate<import("../generated/prisma/runtime/library").DefaultArgs, import("../generated/prisma").Prisma.PrismaClientOptions>;
    get message(): import("../generated/prisma").Prisma.MessageDelegate<import("../generated/prisma/runtime/library").DefaultArgs, import("../generated/prisma").Prisma.PrismaClientOptions>;
    get workflow(): import("../generated/prisma").Prisma.WorkflowDelegate<import("../generated/prisma/runtime/library").DefaultArgs, import("../generated/prisma").Prisma.PrismaClientOptions>;
    get workflowExecution(): import("../generated/prisma").Prisma.WorkflowExecutionDelegate<import("../generated/prisma/runtime/library").DefaultArgs, import("../generated/prisma").Prisma.PrismaClientOptions>;
    get registeredEntity(): import("../generated/prisma").Prisma.RegisteredEntityDelegate<import("../generated/prisma/runtime/library").DefaultArgs, import("../generated/prisma").Prisma.PrismaClientOptions>;
    get prisma(): this;
}
//# sourceMappingURL=prisma.service.d.ts.map