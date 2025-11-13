import { INestApplication, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    enableShutdownHooks(app: INestApplication): Promise<void>;
    get task(): import("./types").Prisma.TaskDelegate<import("../generated/prisma/runtime/library").DefaultArgs, import("./types").Prisma.PrismaClientOptions>;
    get agent(): import("./types").Prisma.AgentDelegate<import("../generated/prisma/runtime/library").DefaultArgs, import("./types").Prisma.PrismaClientOptions>;
    get user(): import("./types").Prisma.UserDelegate<import("../generated/prisma/runtime/library").DefaultArgs, import("./types").Prisma.PrismaClientOptions>;
    get message(): import("./types").Prisma.MessageDelegate<import("../generated/prisma/runtime/library").DefaultArgs, import("./types").Prisma.PrismaClientOptions>;
    get workflow(): import("./types").Prisma.WorkflowDelegate<import("../generated/prisma/runtime/library").DefaultArgs, import("./types").Prisma.PrismaClientOptions>;
    get workflowExecution(): import("./types").Prisma.WorkflowExecutionDelegate<import("../generated/prisma/runtime/library").DefaultArgs, import("./types").Prisma.PrismaClientOptions>;
    get registeredEntity(): import("./types").Prisma.RegisteredEntityDelegate<import("../generated/prisma/runtime/library").DefaultArgs, import("./types").Prisma.PrismaClientOptions>;
    get prisma(): this;
}
//# sourceMappingURL=prisma.service.d.ts.map