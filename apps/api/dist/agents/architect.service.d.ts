import { DrizzleService } from '@the-new-fuse/database';
export interface ArchitectureDecision {
    id: string;
    title: string;
    type: 'refactoring' | 'feature' | 'optimization' | 'security' | 'scalability';
    description: string;
    rationale: string;
    benefits: string[];
    tradeoffs: string[];
    effort: 'low' | 'medium' | 'high';
    impact: number;
    dependencies: string[];
    implementation: {
        steps: string[];
        affectedFiles: string[];
        estimatedTime: string;
    };
}
export interface ArchitectureReview {
    timestamp: Date;
    decisions: ArchitectureDecision[];
    missingFeatures: Array<{
        feature: string;
        priority: 'low' | 'medium' | 'high';
        description: string;
    }>;
    refactoringOpportunities: Array<{
        area: string;
        reason: string;
        benefit: string;
        complexity: 'low' | 'medium' | 'high';
    }>;
    capabilities: Array<{
        name: string;
        description: string;
        value: string;
    }>;
}
export declare class ArchitectAgentService {
    private readonly drizzle;
    private readonly logger;
    private readonly codebaseRoot;
    constructor(drizzle: DrizzleService);
    reviewArchitecture(): Promise<ArchitectureReview>;
    createImplementationPlan(decisionId: string): Promise<ArchitectureDecision | null>;
    suggestNewCapabilities(): Promise<Array<{
        name: string;
        description: string;
        value: string;
    }>>;
    private storeReview;
}
//# sourceMappingURL=architect.service.d.ts.map