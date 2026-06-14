export declare const useTimeline: () => {
    loadTimelineData: (recordId: string) => Promise<{
        status?: string;
    }[]>;
    createBranch: (params?: {
        recordId?: string;
        name?: string;
        startEventId?: string;
        parentBranchId?: string;
    }) => Promise<unknown>;
    mergeBranch: (params?: {
        branchId?: string;
        targetEventId?: string;
        mergedFromEvents?: string[];
    }) => Promise<unknown>;
    createWorkflow: (params?: {
        eventId?: string;
        name?: string;
        description?: string;
        steps?: unknown[];
    }) => Promise<unknown>;
    executeWorkflowStep: (params?: {
        workflowId?: string;
        stepId?: string;
        result?: unknown;
    }) => Promise<unknown>;
    isActive: boolean;
    setIsActive: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    getStatus: () => {
        status: string;
        eventsCount: number;
    };
};
//# sourceMappingURL=useTimeline.d.ts.map