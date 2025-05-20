export type TimelineEventType = 'SUGGESTION' | 'TODO' | 'FEATURE' | 'WORKFLOW_STEP' | 'AGENT' | 'NOTE' | 'VIRTUAL' | 'COMMENT';
export interface TimelineItem {
    id: string;
}
export interface TimelineNote {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author: string;
    color?: string;
    tags?: string[];
}
export interface TimelineRange {
    id: string;
    startDate: Date;
    endDate: Date;
    label: string;
    color?: string;
    type: 'milestone' | 'phase' | 'sprint';
}
export interface TimelineEvent {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: TimelineEventType;
    metadata: Record<string, unknown>;
    parentId?: string;
}
export interface TimelineBranch {
    id: string;
    name: string;
    parentBranchId?: string;
    startEventId: string;
    status: BranchStatus;
    createdAt: string;
}
export interface TimelineWorkflow {
    id: string;
    name: string;
    description: string;
    eventId: string;
    status: WorkflowStatus;
    steps: WorkflowStep[];
}
export interface WorkflowStep {
    id: string;
    workflowId: string;
    name: string;
    status: StepStatus;
    order: number;
    result?: unknown;
}
export declare enum TimelineEventTypeEnum {
    FEATURE = "FEATURE",
    MERGE = "MERGE",
    BRANCH = "BRANCH",
    WORKFLOW = "WORKFLOW"
}
export declare enum BranchStatus {
    ACTIVE = "ACTIVE",
    MERGED = "MERGED",
    ABANDONED = "ABANDONED"
}
export declare enum WorkflowStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare enum StepStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}

export type TimelineElementType = 'milestone' | 'phase' | 'sprint';

export interface TimelineElement {
    id: string;
    title: string;
    description?: string;
    type: TimelineElementType;
    startDate: Date;
    endDate: Date;
    status: string;
    dependencies?: string[];
    metadata?: Record<string, unknown>;
}
