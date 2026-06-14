export interface AgentPerformanceMetrics {
    tasksCompleted: number;
    tasksFailed: number;
    averageResponseTimeMs: number;
    userFeedbackScore?: number;
    errorRate?: number;
    resourceUsage?: {
        memoryMb: number;
        cpuPercent: number;
    };
}
export interface AgentDecision {
    id: string;
    context: string;
    action: string;
    outcome: 'success' | 'failure' | 'uncertain';
    confidence: number;
    timestamp: Date;
    reasoning?: string;
}
export declare class ReflectService {
    private readonly logger;
    /**
     * Reflect on agent performance and behavior based on provided metrics.
     */
    reflectOnPerformance(agentId: string, metrics: AgentPerformanceMetrics): Promise<{
        insights: string[];
        recommendations: string[];
        confidence: number;
    }>;
    /**
     * Analyze agent decision-making patterns from a history of decisions.
     */
    analyzeDecisionPatterns(agentId: string, decisions: AgentDecision[]): Promise<{
        patterns: string[];
        improvements: string[];
    }>;
    /**
     * Generate self-assessment report.
     * Note: In a full implementation, this would fetch historical data from a repository.
     * Currently, it returns a template structure that can be enriched with real data.
     */
    generateSelfAssessment(agentId: string): Promise<{
        strengths: string[];
        weaknesses: string[];
        goals: string[];
    }>;
}
//# sourceMappingURL=reflect.service.d.ts.map