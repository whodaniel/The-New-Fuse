import { FeatureSuggestion } from '../types.js';
interface UseFeatureSuggestionsProps {
    suggestionService: unknown;
}
export declare const useFeatureSuggestions: ({ suggestionService }: UseFeatureSuggestionsProps) => {
    suggestions: FeatureSuggestion[];
    loading: boolean;
    error: Error | null;
    submitSuggestion: () => Promise<void>;
    voteSuggestion: () => Promise<void>;
    convertToFeature: () => Promise<void>;
    addTodo: () => Promise<void>;
    addComment: () => Promise<void>;
    refresh: () => Promise<void>;
};
export {};
