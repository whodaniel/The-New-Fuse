import { ReflectBlock } from './mass-blocks.service';
import { AgentExecutorService } from './mass-blocks.service';
export declare class ReflectService {
    private readonly reflectBlock;
    private readonly agentExecutor;
    constructor(reflectBlock: ReflectBlock, agentExecutor: AgentExecutorService);
    execute(predictorAgentId: string, reflectorAgentId: string, input: any, config: {
        maxRounds?: number;
        userId?: string;
    }): Promise<{
        result: any;
        executionMetrics: any;
    }>;
}
//# sourceMappingURL=reflect.service.d.ts.map