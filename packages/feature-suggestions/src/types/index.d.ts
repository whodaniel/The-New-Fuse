import { SuggestionStatus, SuggestionPriority } from '@the-new-fuse/types/core/enums';
export interface FeatureSuggestion {
    id: string;
    title: string;
    description: string;
    status: SuggestionStatus;
    priority: SuggestionPriority;
    userId: string;
    votes?: VotingRecord[];
    comments?: Comment[];
    todos?: TodoItem[];
    createdAt: Date;
    updatedAt: Date;
}
export interface VotingRecord {
    id: string;
    userId: string;
    featureSuggestionId: string;
    vote: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface Comment {
    id: string;
    content: string;
    userId: string;
    featureSuggestionId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface TodoItem {
    id: string;
    title: string;
    completed: boolean;
    userId: string;
    featureSuggestionId: string;
    assignedTo?: string;
    createdAt: Date;
    updatedAt: Date;
}
