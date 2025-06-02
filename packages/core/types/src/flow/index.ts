
export enum FlowStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}

export type FlowState = {
    status: FlowStatus;
    progress?: number;
    startTime?: Date;
    endTime?: Date;
    error?: Error;
};
