/**
 * TNF CLI Auto-Improvement Service
 * Provides automated code quality, dependency, and infrastructure improvements.
 */
export declare class AutoImproveService {
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Run all auto-improvement checks and fixes.
     */
    runAll(): Promise<{
        fixes: string[];
        errors: string[];
    }>;
    /**
     * Ensure turbo.json has required tasks.
     */
    private fixTurboTasks;
    /**
     * Detect and install missing dependencies.
     */
    private fixMissingDeps;
    /**
     * Run lint fix across the project.
     */
    private fixLintIssues;
    /**
     * Run type-check and report issues.
     */
    private fixTypeIssues;
}
//# sourceMappingURL=AutoImproveService.d.ts.map