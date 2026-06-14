export interface ToolCallRecord {
    step: number;
    toolName: string;
    parameters: Record<string, unknown>;
    output: unknown;
    timestamp: string;
    durationMs: number;
}
export interface ToolCallEvaluation {
    step: number;
    toolName: string;
    toolSelectionCorrect: boolean;
    toolSelectionReason: string;
    parametersCorrect: boolean;
    parametersIssues: string[];
    outputInterpretedCorrectly: boolean;
    outputIssues: string[];
    overallScore: number;
}
export interface MultiStepEvaluationResult {
    sessionId: string;
    agentId: string;
    totalSteps: number;
    evaluations: ToolCallEvaluation[];
    aggregateScore: number;
    toolSelectionAccuracy: number;
    parameterAccuracy: number;
    outputInterpretationAccuracy: number;
    recommendations: string[];
}
export declare class ToolCallEvaluationService {
    private readonly logger;
    private readonly sessions;
    recordToolCall(sessionId: string, record: Omit<ToolCallRecord, 'step' | 'timestamp'>): number;
    getSessionTrace(sessionId: string): ToolCallRecord[];
    evaluateStep(record: ToolCallRecord, expectedTool?: string, expectedParams?: Partial<Record<string, unknown>>, outputValidator?: (output: unknown) => {
        valid: boolean;
        issues: string[];
    }): ToolCallEvaluation;
    evaluateSession(sessionId: string, agentId: string, expectations?: Array<{
        step: number;
        expectedTool?: string;
        expectedParams?: Partial<Record<string, unknown>>;
        outputValidator?: (output: unknown) => {
            valid: boolean;
            issues: string[];
        };
    }>): MultiStepEvaluationResult;
    clearSession(sessionId: string): void;
    private generateRecommendations;
}
//# sourceMappingURL=ToolCallEvaluationService.d.ts.map