import { FeatureSuggestion, TodoItem, SuggestionStatus, SuggestionService, TaskStatus } from '../types/index';
import { Table, View, Row, Column, AppState } from '@the-new-fuse/fairtable-core';
interface DraggableLocation {
    droppableId: string;
    index: number;
}
interface DragResult {
    draggableId: string;
    type: string;
    source: DraggableLocation;
    destination: DraggableLocation | null;
}
interface KanbanColumn {
    id: string;
    title: string;
    items: (FeatureSuggestion | TodoItem)[];
}
interface UseKanbanBoardProps {
    suggestionService: SuggestionService;
    initialSuggestions?: FeatureSuggestion[];
    initialTodos?: TodoItem[];
    retryAttempts?: number;
}
interface FilterCriteria {
    searchTerm: string;
    priorities: string[];
    tags: string[];
}
export declare const useKanbanBoard: ({ suggestionService, initialSuggestions, initialTodos, retryAttempts }: UseKanbanBoardProps) => {
    suggestions: FeatureSuggestion[];
    todos: TodoItem[];
    loading: boolean;
    error: Error | null;
    updateSuggestionStatus: (id: string, status: SuggestionStatus) => Promise<void>;
    updateTodoStatus: (id: string, status: TaskStatus) => Promise<void>;
    convertSuggestionToFeature: (suggestionId: string) => Promise<FeatureSuggestion>;
    handleBatchOperation: (operation: "move" | "delete" | "duplicate", itemIds: string[], newStatus?: SuggestionStatus | TaskStatus) => Promise<void>;
    refresh: () => Promise<void>;
    columns: KanbanColumn[];
    handleDragEnd: (result: DragResult) => Promise<void>;
    filters: FilterCriteria;
    availableTags: string[];
    updateSearchTerm: (term: string) => void;
    updatePriorityFilter: (priorities: string[]) => void;
    updateTagsFilter: (tags: string[]) => void;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    airtableData: {
        table: Table;
        view: View;
        appState: AppState;
        columnsToDisplay: Column[];
        rowsToDisplay: Row[];
    };
};
export {};
//# sourceMappingURL=useKanbanBoard.d.ts.map