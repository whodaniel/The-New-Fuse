import { FeatureSuggestion, SuggestionStatus, SuggestionPriority, TodoItem } from '../types';
import { SuggestionService } from '../services/types';
/**
 * Props for the useFeatureSuggestions hook
 */
interface UseFeatureSuggestionsProps {
    /**
     * The suggestion service to use
     */
    suggestionService: SuggestionService;
}
/**
 * Return type for the useFeatureSuggestions hook
 */
interface UseFeatureSuggestionsReturn {
    suggestions: FeatureSuggestion[];
    loading: boolean;
    error: Error | null;
    submitSuggestion: (title: string, description: string, submittedBy: string, priority: SuggestionPriority, tags: string[]) => Promise<FeatureSuggestion>;
    voteSuggestion: (suggestionId: string, userId: string) => Promise<void>;
    convertToFeature: (suggestionId: string) => Promise<FeatureSuggestion>;
    updateSuggestionStatus: (suggestionId: string, newStatus: SuggestionStatus) => Promise<void>;
    convertSuggestionToFeature: (suggestionId: string) => Promise<FeatureSuggestion>;
    addTodo: (title: string, description: string, priority: SuggestionPriority, suggestionId: string, assignedTo?: string, dueDate?: Date) => Promise<TodoItem>;
    addComment: (suggestionId: string, content: string, authorId: string) => Promise<Comment>;
    refresh: () => Promise<void>;
}
export declare const useFeatureSuggestions: ({ suggestionService }: UseFeatureSuggestionsProps) => UseFeatureSuggestionsReturn;
export {};
//# sourceMappingURL=useFeatureSuggestions.d.ts.map