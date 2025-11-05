import { AggregateBlock } from './mass-blocks.service';
import { AgentExecutorService } from './mass-blocks.service';
export declare class AggregateService {
    private readonly aggregateBlock;
    private readonly agentExecutor;
    constructor(aggregateBlock: AggregateBlock, agentExecutor: AgentExecutorService);
    execute(agentId: string, inputs: any[], config: {
        aggregationMethod: 'average' | 'weighted' | 'consensus' | 'majority';
        weights?: number[];
        threshold?: number;
        userId?: string;
    }): Promise<{
        result: any;
        executionMetrics: any;
    }>;
}
//# sourceMappingURL=aggregate.service.d.ts.map