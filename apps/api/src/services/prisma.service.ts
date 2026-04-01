// @ts-nocheck
/**
 * DrizzleService - Legacy compatibility layer
 *
 * This service now wraps the DatabaseService from @the-new-fuse/database
 * which uses Drizzle ORM instead of Drizzle.
 *
 * @deprecated Use DatabaseService directly from @the-new-fuse/database
 */
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DatabaseService } from '@the-new-fuse/database';

@Injectable()
export class DrizzleService extends DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly drizzleLogger = new Logger(DrizzleService.name);

  // Aliases for backward compatibility with Drizzle-style property access
  get user() { return this.users; }
  get agent() { return this.agents; }
  get chat() { return this.chats; }
  get task() { return this.tasks; }
  get workflow() { return this.workflows; }
  get workspace() { return this.workspaces; }

  // Stubs for models not yet migrated to Drizzle Repositories
  // These return a Proxy to allow compilation but will throw clear errors at runtime
  get wallet(): any { return this.createProxy('wallet'); }
  get promptTemplate(): any { return this.createProxy('promptTemplate'); }
  get promptVersion(): any { return this.createProxy('promptVersion'); }
  get workflowExecution(): any { return this.createProxy('workflowExecution'); }
  get lLMConfig(): any { return this.createProxy('lLMConfig'); }

  private createProxy(modelName: string) {
    return new Proxy({}, {
      get: (target, prop) => {
        // Return a function that throws
        return (...args: any[]) => {
          const msg = `Model '${modelName}' is not yet migrated to Drizzle. Operation '${String(prop)}' failed.`;
          this.drizzleLogger.error(msg);
          throw new Error(msg);
        };
      }
    });
  }
}
