import { FeatureSuggestion, TodoItem, SuggestionService } from '../types.js';
export declare const useKanbanBoard: ({ suggestionService, initialSuggestions, initialTodos, }: {
    suggestionService: SuggestionService;
    initialSuggestions?: FeatureSuggestion[];
    initialTodos?: TodoItem[];
}) => void;
