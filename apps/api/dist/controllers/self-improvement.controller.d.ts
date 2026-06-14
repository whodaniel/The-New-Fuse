import { CoordinatorAgentService } from '../agents/coordinator.service';
import { AnalyzerAgentService } from '../agents/analyzer.service';
import { ArchitectAgentService } from '../agents/architect.service';
import { ImplementerAgentService } from '../agents/implementer.service';
import { ReviewerAgentService } from '../agents/reviewer.service';
export declare class SelfImprovementController {
    private readonly coordinator;
    private readonly analyzer;
    private readonly architect;
    private readonly implementer;
    private readonly reviewer;
    private readonly logger;
    constructor(coordinator: CoordinatorAgentService, analyzer: AnalyzerAgentService, architect: ArchitectAgentService, implementer: ImplementerAgentService, reviewer: ReviewerAgentService);
    startCycle(): Promise<{
        success: boolean;
        cycleId: string;
        status: "completed" | "failed" | "running";
        message: string;
    }>;
    getCycleStatus(): Promise<{
        active: boolean;
        message: string;
        cycleId?: undefined;
        status?: undefined;
        phase?: undefined;
        progress?: undefined;
        metrics?: undefined;
    } | {
        active: boolean;
        cycleId: string;
        status: "completed" | "failed" | "running";
        phase: "analysis" | "architecture" | "implementation" | "review" | "deployment";
        progress: {
            totalTasks: number;
            completed: number;
            inProgress: number;
            pending: number;
            failed: number;
            percentComplete: number;
        };
        metrics: {
            totalIssuesFound: number;
            issuesFixed: number;
            featuresAdded: number;
            testsCreated: number;
            codeReviewScore: number;
        };
        message?: undefined;
    }>;
    getCycleReport(): Promise<{
        success: boolean;
        report: {
            summary: string;
            metrics: {
                totalIssuesFound: number;
                issuesFixed: number;
                featuresAdded: number;
                testsCreated: number;
                codeReviewScore: number;
            };
            improvements: Array<{
                title: string;
                status: string;
            }>;
            chatLog: import("../agents/coordinator.service").ChatMessage[];
            timeline: Array<{
                time: Date;
                event: string;
            }>;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        report?: undefined;
    }>;
    getChatHistory(): Promise<{
        success: boolean;
        messages: import("../agents/coordinator.service").ChatMessage[];
        count: number;
    }>;
    runAnalysis(): Promise<{
        success: boolean;
        analysis: {
            totalIssues: number;
            criticalIssues: number;
            highIssues: number;
            technicalDebtScore: number;
            topIssues: import("../agents/analyzer.service").CodeIssue[];
        };
    }>;
    reviewArchitecture(): Promise<{
        success: boolean;
        review: {
            decisions: number;
            missingFeatures: {
                feature: string;
                priority: "low" | "medium" | "high";
                description: string;
            }[];
            topDecisions: import("../agents/architect.service").ArchitectureDecision[];
            capabilities: {
                name: string;
                description: string;
                value: string;
            }[];
        };
    }>;
    implement(body: {
        issue: any;
    }): Promise<{
        success: boolean;
        implementation: import("../agents/implementer.service").Implementation;
    }>;
    review(body: {
        implementation: any;
    }): Promise<{
        success: boolean;
        review: {
            approved: boolean;
            score: number;
            decision: "approve" | "reject" | "request_changes";
            feedback: string;
            criticalIssues: number;
        };
    }>;
    getAgentsStatus(): Promise<{
        success: boolean;
        agents: {
            name: string;
            status: string;
            description: string;
        }[];
    }>;
}
//# sourceMappingURL=self-improvement.controller.d.ts.map