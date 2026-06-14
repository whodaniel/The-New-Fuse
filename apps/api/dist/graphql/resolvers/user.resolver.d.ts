import type { User } from '@the-new-fuse/database';
import { DatabaseService } from '@the-new-fuse/database';
import { AgentLoader } from '../loaders/agent.loader';
import { WorkflowLoader } from '../loaders/workflow.loader';
export declare class UserResolver {
    private readonly db;
    private readonly agentLoader;
    private readonly workflowLoader;
    constructor(db: DatabaseService, agentLoader: AgentLoader, workflowLoader: WorkflowLoader);
    user(id: string): Promise<User | null>;
    me(context: any): Promise<User | null>;
    users(): Promise<User[]>;
    agents(user: User): Promise<any[]>;
    workflows(user: User): Promise<any[]>;
    fullName(user: User): string | null;
    preferences(user: User): string | null;
    metadata(user: User): string | null;
}
//# sourceMappingURL=user.resolver.d.ts.map