import { PrismaService } from '@the-new-fuse/database';
import { TopologyOptimizationConfig, WorkflowTopology } from '@the-new-fuse/types/dist/mass';
import { EvaluationHarnessService } from './prompt-optimizer.service';
export declare class TopologyOptimizerService {
    private readonly prisma;
    private readonly evaluationHarness;
    private readonly logger;
    constructor(prisma: PrismaService, evaluationHarness: EvaluationHarnessService);
    optimizeTopology(agentIds: string[], config: TopologyOptimizationConfig): Promise<WorkflowTopology>;
    private getOptimizedAgents;
    private calculateInfluenceScores;
    private getLatestPrompt;
    private generateCandidateTopologies;
    private generateTopologyByPattern;
    private selectTopAgentsByInfluence;
    private createLinearTopology;
    private createParallelTopology;
    private createDebateTopology;
    private createReflectTopology;
    private createAggregateTopology;
    private createHierarchicalTopology;
    private generateRandomTopology;
    private weightedRandomSelection;
    private evaluateTopology;
    private selectBestTopology;
    private saveTopology;
}
//# sourceMappingURL=topology-optimizer.service.d.ts.map