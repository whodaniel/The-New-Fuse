import { FeatureSuggestion, TodoItem, SuggestionStatus, SuggestionService, TaskStatus } from '../types/index';
declare enum DataType {
    text = "text",
    number = "number",
    boolean = "boolean",
    date = "date",
    TEXT = "TEXT",
    LONG_TEXT = "LONG_TEXT",
    SINGLE_SELECT = "SINGLE_SELECT"
}
declare enum ViewType {
    table = "table",
    kanban = "kanban",
    calendar = "calendar",
    KANBAN = "KANBAN"
}
interface Column {
    id: string;
    name: string;
    type: DataType;
    width?: number;
    options?: Array<{
        id: string;
        name: string;
        colorClass: string;
    }>;
}
interface Table {
    id: string;
    name: string;
    columns?: Column[];
    views?: View[];
    rows?: any[];
    columnOrder?: string[];
    activeViewId?: string;
}
interface View {
    id: string;
    name: string;
    type?: ViewType;
    filters?: any[];
    sorts?: any[];
    groupBy?: any[];
    columnOrder?: string[];
    options?: any;
    columnVisibility?: Record<string, boolean>;
}
interface Row {
    id: string;
    [key: string]: any;
}
interface AppState {
    [key: string]: any;
}
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
    suggestions: any;
    todos: any;
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
    canUndo: any;
    canRedo: any;
    undo: any;
    redo: any;
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