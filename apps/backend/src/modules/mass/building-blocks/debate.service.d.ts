import { DebateBlock } from './mass-blocks.service';
import { AgentExecutorService } from './mass-blocks.service';
export declare class DebateService {
    private readonly debateBlock;
    private readonly agentExecutor;
    constructor(debateBlock: DebateBlock, agentExecutor: AgentExecutorService);
    execute(debaterAgentIds: string[], input: any, config: {
        debateRounds?: number;
        votingStrategy?: 'majority' | 'weighted' | 'consensus';
        userId?: string;
    }): Promise<{
        result: any;
        executionMetrics: any;
    }>;
}
//# sourceMappingURL=debate.service.d.ts.map