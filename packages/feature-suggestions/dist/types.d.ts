export declare enum FeatureStage {
    ANALYSIS = "ANALYSIS",
    DESIGN = "DESIGN",
    DEVELOPMENT = "DEVELOPMENT",
    TESTING = "TESTING",
    REVIEW = "REVIEW",
    DEPLOYMENT = "DEPLOYMENT",
    COMPLETED = "COMPLETED",
    IN_PROGRESS = "IN_PROGRESS"
}
export declare enum SuggestionPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum SuggestionStatus {
    NEW = "NEW",
    UNDER_REVIEW = "UNDER_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    IMPLEMENTED = "IMPLEMENTED",
    SUBMITTED = "SUBMITTED",
    PENDING = "PENDING",
    CONVERTED = "CONVERTED"
}
export * from '@the-new-fuse/types';
export interface FeatureSuggestion {
    id: string;
    title: string;
    description: string;
    submittedBy: string;
    submittedAt: Date;
    status: SuggestionStatus;
    priority: SuggestionPriority;
    votes: number;
    tags: string[];
    relatedTodoIds: string[];
    convertedFeatureId?: string;
    estimatedEffort?: string;
    businessValue?: string;
    technicalComplexity?: string;
    updatedAt: Date;
}
export type DraggableItem = FeatureSuggestion | TodoItem;
export interface KanbanColumn {
    id: string;
    title: string;
    items: DraggableItem[];
}
export interface TodoItem {
    id: string;
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority: SuggestionPriority;
    assignedTo?: string;
    dueDate?: Date;
    featureId?: string;
    suggestionId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface VotingRecord {
    userId: string;
    suggestionId: string;
    votedAt: Date;
}
export interface Comment {
    id: string;
    content: string;
    authorId: string;
    suggestionId: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=types.d.ts.map