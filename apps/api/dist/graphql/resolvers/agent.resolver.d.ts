import type { Agent, User } from '@the-new-fuse/database';
import { DatabaseService } from '@the-new-fuse/database';
import { UserLoader } from '../loaders/user.loader';
import { AgentStatus } from '../types/agent.type';
import { CreateAgentInput, UpdateAgentInput } from '../types/input.types';
export declare class AgentResolver {
    private readonly db;
    private readonly userLoader;
    constructor(db: DatabaseService, userLoader: UserLoader);
    agent(id: string, context: any): Promise<Agent | null>;
    agents(userIdArg?: string, context?: any): Promise<Agent[]>;
    createAgent(input: CreateAgentInput, context: any): Promise<Agent>;
    updateAgent(input: UpdateAgentInput, context: any): Promise<Agent>;
    owner(agent: Agent): Promise<User | null>;
    status(agent: Agent): AgentStatus;
    config(agent: Agent): string | null;
    metadata(agent: Agent): string | null;
}
//# sourceMappingURL=agent.resolver.d.ts.map