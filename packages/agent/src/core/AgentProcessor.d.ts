import { UUID } from '@the-new-fuse/api-types/src/common';
/**
 * Main processor for an agent instance.
 * Routes incoming messages to the appropriate specialized processor (Command, Task, Notification).
 */
export declare class AgentProcessor {
    private logger;
    private agentId;
    constructor(agentId: UUID);
}
//# sourceMappingURL=AgentProcessor.d.ts.map