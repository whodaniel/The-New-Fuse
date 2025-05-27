import { AgentClient } from './src/agent-communication.js';
import { Logger } from './src/core/logging.js';
import { TheFuseAPI } from './src/types.js';
export declare class TheFuseAPIImpl implements TheFuseAPI {
    private readonly agentClient;
    private readonly logger;
    constructor(agentClient: AgentClient, logger: Logger);
    sendMessage(message: string): Promise<string>;
    getAvailableModels(): Promise<string[]>;
    getCurrentModel(): Promise<string>;
}
//# sourceMappingURL=thefuse-api.d.ts.map