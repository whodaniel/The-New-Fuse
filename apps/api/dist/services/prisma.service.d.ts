/**
 * DrizzleService - Legacy compatibility layer
 *
 * This service now wraps the DatabaseService from @the-new-fuse/database
 * which uses Drizzle ORM instead of Drizzle.
 *
 * @deprecated Use DatabaseService directly from @the-new-fuse/database
 */
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
export declare class DrizzleService extends DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly drizzleLogger;
    get user(): import("@the-new-fuse/database").DrizzleUserRepository;
    get agent(): import("@the-new-fuse/database").DrizzleAgentRepository;
    get chat(): import("@the-new-fuse/database").DrizzleChatRepository;
    get task(): import("@the-new-fuse/database").DrizzleTaskRepository;
    get workflow(): import("@the-new-fuse/database").DrizzleWorkflowRepository;
    get workspace(): import("@the-new-fuse/database").DrizzleWorkspaceRepository;
    get wallet(): any;
    get promptTemplate(): any;
    get promptVersion(): any;
    get workflowExecution(): any;
    get lLMConfig(): any;
    private createProxy;
}
//# sourceMappingURL=prisma.service.d.ts.map