import { DrizzleService } from '@the-new-fuse/database';
export interface ImprovementTask {
    id: string;
    title: string;
    description: string;
    type: 'bug-fix' | 'feature' | 'refactor' | 'optimization' | 'test';
    files: Array<{
        path: string;
        changes: Array<{
            type: 'create' | 'update' | 'delete';
            content?: string;
            lineStart?: number;
            lineEnd?: number;
        }>;
    }>;
    tests: Array<{
        path: string;
        content: string;
    }>;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    error?: string;
}
export interface Implementation {
    taskId: string;
    success: boolean;
    filesModified: string[];
    testsCreated: string[];
    commitMessage: string;
    error?: string;
}
export declare class ImplementerAgentService {
    private readonly drizzle;
    private readonly logger;
    private readonly codebaseRoot;
    constructor(drizzle: DrizzleService);
    implementImprovement(task: ImprovementTask): Promise<Implementation>;
    implementQuickFix(issue: {
        file: string;
        description: string;
        suggestion: string;
    }): Promise<Implementation>;
    private generateFixForIssue;
    createFeature(feature: {
        name: string;
        description: string;
        specification: string;
    }): Promise<Implementation>;
    private scaffoldFeature;
    private generateServiceTemplate;
    private generateControllerTemplate;
    private generateFeatureTests;
    private createFile;
    private updateFile;
    private runTests;
    private generateCommitMessage;
    createPullRequest(implementation: Implementation): Promise<{
        url: string;
    }>;
}
//# sourceMappingURL=implementer.service.d.ts.map