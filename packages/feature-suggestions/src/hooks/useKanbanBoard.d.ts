import { FeatureSuggestion, TodoItem, SuggestionService } from '../types';
export declare const useKanbanBoard: ({ suggestionService, initialSuggestions, initialTodos, }: {
    suggestionService: SuggestionService;
    initialSuggestions?: FeatureSuggestion[];
    initialTodos?: TodoItem[];
}) => void;
