import { DrizzleService } from '@the-new-fuse/database';
import { AnalyzerAgentService } from './analyzer.service';
import { ArchitectAgentService } from './architect.service';
import { ImplementerAgentService } from './implementer.service';
import { ReviewerAgentService } from './reviewer.service';
interface ImprovementCycle {
    id: string;
    startTime: Date;
    endTime?: Date;
    status: 'running' | 'completed' | 'failed';
    phase: 'analysis' | 'architecture' | 'implementation' | 'review' | 'deployment';
    improvements: Array<{
        id: string;
        title: string;
        status: 'pending' | 'in_progress' | 'completed' | 'failed';
        assignedAgent: string;
        startTime: Date;
        endTime?: Date;
        result?: any;
    }>;
    metrics: {
        totalIssuesFound: number;
        issuesFixed: number;
        featuresAdded: number;
        testsCreated: number;
        codeReviewScore: number;
    };
    logs: Array<{
        timestamp: Date;
        agent: string;
        message: string;
        level: 'info' | 'warning' | 'error';
    }>;
}
export interface ChatMessage {
    from: string;
    to: string;
    message: string;
    timestamp: Date;
    metadata?: any;
}
export declare class CoordinatorAgentService {
    private readonly drizzle;
    private readonly analyzer;
    private readonly architect;
    private readonly implementer;
    private readonly reviewer;
    private readonly logger;
    private currentCycle;
    private chatHistory;
    constructor(drizzle: DrizzleService, analyzer: AnalyzerAgentService, architect: ArchitectAgentService, implementer: ImplementerAgentService, reviewer: ReviewerAgentService);
    startSelfImprovementCycle(): Promise<ImprovementCycle>;
    private runAnalysisPhase;
    private runArchitecturePhase;
    private runImplementationPhase;
    private runReviewPhase;
    private runDeploymentPhase;
    private addLog;
    private sendMessage;
    private broadcastMessage;
    getChatHistory(): Promise<ChatMessage[]>;
    getCurrentCycle(): Promise<ImprovementCycle | null>;
    getCycleReport(): Promise<{
        summary: string;
        metrics: ImprovementCycle['metrics'];
        improvements: Array<{
            title: string;
            status: string;
        }>;
        chatLog: ChatMessage[];
        timeline: Array<{
            time: Date;
            event: string;
        }>;
    }>;
    private storeCycle;
    prioritizeTasks(): Promise<void>;
    trackProgress(): Promise<{
        totalTasks: number;
        completed: number;
        inProgress: number;
        pending: number;
        failed: number;
        percentComplete: number;
    }>;
}
export {};
//# sourceMappingURL=coordinator.service.d.ts.map