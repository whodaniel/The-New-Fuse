import { PrismaService } from '../../lib/prisma/prisma.service';
import { MassOptimizationConfig, PerformanceMetrics, PromptDefinition, AgentPromptVersion } from '@the-new-fuse/types';
export declare class PromptOptimizerService {
    private readonly prisma;
    private readonly llmService;
    private readonly evaluationHarness;
    private readonly logger;
    constructor(prisma: PrismaService, llmService: LlmInteractionService, evaluationHarness: EvaluationHarnessService);
    optimizeAgentPrompt(agentId: string, config: MassOptimizationConfig): Promise<AgentPromptVersion>;
    private getCurrentPrompt;
    private generateCandidatePrompts;
    private generateInstructionVariations;
    private generateExemplarVariations;
    private selectBestCandidate;
    private createPromptVersion;
}
export declare class LlmInteractionService {
    private readonly logger;
    generateText(prompt: string, config: any): Promise<string>;
    executeAgent(agentId: string, input: any, prompt?: PromptDefinition): Promise<any>;
}
export declare class EvaluationHarnessService {
    private readonly llmService;
    private readonly logger;
    constructor(llmService: LlmInteractionService);
    evaluatePrompt(agentId: string, prompt: PromptDefinition, validationItems: any[], config: MassOptimizationConfig): Promise<PerformanceMetrics>;
    evaluateTopology(topologyId: string, validationItems: any[], config: MassOptimizationConfig): Promise<PerformanceMetrics>;
    private executeTopology;
    private calculateScore;
    private calculateF1Score;
}
//# sourceMappingURL=prompt-optimizer.service.d.ts.map