import { SuggestionStatus, SuggestionPriority, FeatureStage } from './core/suggestion-enums.js';
export interface StageTransition {
    id: string;
    featureId: string;
    fromStage?: FeatureStage | null;
    toStage: FeatureStage;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface FeatureSuggestion {
    id: string;
    title: string;
    description: string;
    status: SuggestionStatus;
    priority: SuggestionPriority;
    submittedBy: string;
    submittedAt: Date;
    votes: VotingRecord[];
    tags: string[];
    relatedTodoIds: string[];
    updatedAt: Date;
}
export interface TodoItem {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
}
export interface Comment {
    id: string;
    content: string;
    authorId: string;
    suggestionId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface VotingRecord {
    id: string;
    suggestionId: string;
    votedAt: Date;
    vote: number;
}
export interface FeatureMetrics {
    [key: string]: unknown;
    usageCount: number;
    errorRate: number;
    performanceMetrics: {
        avgResponseTime: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
    };
    userSatisfaction: number;
}
export interface QualitativeData {
    [key: string]: unknown;
    feedback: string;
    source: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    dateCaptured: string;
}
export interface Feature {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    assignedTo?: string;
    stage: FeatureStage;
    metrics?: FeatureMetrics;
    qualitativeData: QualitativeData[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=feature.d.ts.map