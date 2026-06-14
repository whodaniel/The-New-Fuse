/**
 * Brand Consistency Self-Improving Agent
 *
 * This agent is responsible for maintaining and improving brand consistency
 * across all pages and networked components of The New Fuse platform.
 *
 * It uses the Three Pillars:
 * - Orchestrator: Registers itself and receives tasks
 * - Message Broker: Communicates with other agents
 * - Prompt Templating: Modifies its own prompts based on learned patterns
 */
import { OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@the-new-fuse/database';
export interface BrandConsistencyConfig {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    headingFont: string;
    fontSizes: {
        xs: string;
        sm: string;
        base: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
    };
    spacingUnit: number;
    borderRadius: string;
    buttonStyles: {
        primary: Record<string, string>;
        secondary: Record<string, string>;
        ghost: Record<string, string>;
    };
    animationDuration: string;
    animationEasing: string;
}
export interface ComponentAnalysis {
    componentPath: string;
    componentName: string;
    issues: BrandIssue[];
    suggestions: BrandSuggestion[];
    consistencyScore: number;
    lastAnalyzed: Date;
}
export interface BrandIssue {
    type: 'color' | 'typography' | 'spacing' | 'animation' | 'pattern';
    severity: 'critical' | 'major' | 'minor';
    description: string;
    location: string;
    currentValue: string;
    expectedValue: string;
}
export interface BrandSuggestion {
    type: 'fix' | 'enhancement' | 'refactor';
    description: string;
    code: string;
    impact: 'high' | 'medium' | 'low';
}
export interface AgentLearningState {
    totalAnalyses: number;
    successfulFixes: number;
    patternsLearned: string[];
    promptEvolutions: number;
    currentPromptVersion: number;
    lastImprovement: Date;
    performanceMetrics: {
        averageAnalysisTime: number;
        issueDetectionAccuracy: number;
        fixSuccessRate: number;
    };
}
export declare class BrandConsistencyAgentService implements OnModuleInit {
    private readonly db;
    private readonly eventEmitter;
    private readonly logger;
    private readonly agentId;
    private readonly agentName;
    private readonly agentVersion;
    private brandConfig;
    private learningState;
    private analysisCache;
    private corePrompt;
    constructor(db: DatabaseService, eventEmitter: EventEmitter2);
    onModuleInit(): Promise<void>;
    /**
     * Initialize the agent's prompt template in the database
     */
    private initializePromptTemplate;
    private isMissingPromptTemplateSchema;
    /**
     * Get agent information
     */
    getAgentInfo(): {
        id: string;
        name: string;
        version: string;
        capabilities: string[];
        status: string;
        learningState: AgentLearningState;
        brandConfig: BrandConsistencyConfig;
    };
    /**
     * Analyze a component for brand consistency
     */
    analyzeComponent(componentPath: string, componentCode: string): Promise<ComponentAnalysis>;
    /**
     * Check color consistency
     */
    private checkColorConsistency;
    /**
     * Check typography consistency
     */
    private checkTypographyConsistency;
    /**
     * Check spacing consistency
     */
    private checkSpacingConsistency;
    /**
     * Check animation consistency
     */
    private checkAnimationConsistency;
    /**
     * Check pattern consistency (buttons, cards, etc.)
     */
    private checkPatternConsistency;
    /**
     * Find the closest brand color to a given color
     */
    private findClosestBrandColor;
    /**
     * Calculate consistency score based on issues
     */
    private calculateConsistencyScore;
    /**
     * Extract component name from path
     */
    private extractComponentName;
    /**
     * Self-improve the agent's prompt based on learned patterns
     */
    selfImprove(feedback: {
        issueType: string;
        wasHelpful: boolean;
        learnedPattern?: string;
    }): Promise<void>;
    /**
     * Evolve the core prompt with learned patterns
     */
    private evolvePrompt;
    /**
     * Get analysis summary across all cached components
     */
    getAnalysisSummary(): {
        totalComponents: number;
        averageConsistency: number;
        issuesByType: Record<string, number>;
        criticalIssues: number;
        suggestions: BrandSuggestion[];
    };
    /**
     * Generate CSS variables for brand consistency
     */
    generateBrandCSS(): string;
}
//# sourceMappingURL=brand-consistency-agent.service.d.ts.map