/**
 * Brand Consistency Agent Controller
 *
 * Exposes REST endpoints for the self-improving Brand Consistency Agent.
 * This agent analyzes components for brand consistency and evolves its
 * detection capabilities over time.
 */
import { BrandConsistencyAgentService } from './brand-consistency-agent.service';
export declare class BrandConsistencyController {
    private readonly agentService;
    private readonly logger;
    constructor(agentService: BrandConsistencyAgentService);
    /**
     * Get agent information and current state
     */
    getAgentInfo(): {
        id: string;
        name: string;
        version: string;
        capabilities: string[];
        status: string;
        learningState: import("./brand-consistency-agent.service").AgentLearningState;
        brandConfig: import("./brand-consistency-agent.service").BrandConsistencyConfig;
    };
    /**
     * Analyze a component for brand consistency
     */
    analyzeComponent(body: {
        componentPath: string;
        componentCode: string;
    }): Promise<import("./brand-consistency-agent.service").ComponentAnalysis>;
    /**
     * Provide feedback for self-improvement
     */
    provideFeedback(body: {
        issueType: string;
        wasHelpful: boolean;
        learnedPattern?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Get analysis summary across all analyzed components
     */
    getAnalysisSummary(): {
        totalComponents: number;
        averageConsistency: number;
        issuesByType: Record<string, number>;
        criticalIssues: number;
        suggestions: import("./brand-consistency-agent.service").BrandSuggestion[];
    };
    /**
     * Generate brand CSS variables and utilities
     */
    getBrandCSS(): {
        css: string;
        contentType: string;
    };
    /**
     * Analyze multiple components at once
     */
    analyzeBatch(body: {
        components: Array<{
            path: string;
            code: string;
        }>;
    }): Promise<{
        totalComponents: number;
        results: any[];
        summary: {
            totalComponents: number;
            averageConsistency: number;
            issuesByType: Record<string, number>;
            criticalIssues: number;
            suggestions: import("./brand-consistency-agent.service").BrandSuggestion[];
        };
    }>;
    /**
     * Run a demonstration of the agent's capabilities
     */
    runDemo(): Promise<{
        message: string;
        analysis: import("./brand-consistency-agent.service").ComponentAnalysis;
        agentInfo: {
            id: string;
            name: string;
            version: string;
            capabilities: string[];
            status: string;
            learningState: import("./brand-consistency-agent.service").AgentLearningState;
            brandConfig: import("./brand-consistency-agent.service").BrandConsistencyConfig;
        };
        brandCSS: string;
    }>;
}
//# sourceMappingURL=brand-consistency.controller.d.ts.map