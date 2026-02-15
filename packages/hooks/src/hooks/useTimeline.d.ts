export declare const useTimeline: () => {
    loadTimelineData: (branchId: string) => Promise<void>;
    createBranch: () => Promise<void>;
    mergeBranch: () => Promise<void>;
    createWorkflow: () => Promise<void>;
    executeWorkflowStep: () => Promise<void>;
    isActive: boolean;
    setIsActive: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    getStatus: () => {
        status: string;
    };
};
