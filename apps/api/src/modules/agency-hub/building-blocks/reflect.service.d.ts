export declare class ReflectService {
    private readonly logger;
    /**
     * Reflect on agent performance and behavior
     */
    reflectOnPerformance(agentId: string, metrics: any): Promise<{
        insights: string[];
        recommendations: string[];
        confidence: number;
    }>;
    /**
     * Analyze agent decision-making patterns
     */
    analyzeDecisionPatterns(agentId: string, decisions: any[]): Promise<{
        patterns: string[];
        improvements: string[];
    }>;
    /**
     * Generate self-assessment report
     */
    generateSelfAssessment(agentId: string): Promise<{
        strengths: string[];
        weaknesses: string[];
        goals: string[];
    }>;
}
//# sourceMappingURL=reflect.service.d.ts.map