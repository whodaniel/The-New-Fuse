import { KanbanColumn } from '../types';
import { SuggestionService } from '../services/types';
interface UseKanbanBoardProps {
    suggestionService: SuggestionService;
}
export declare const useKanbanBoard: ({ suggestionService }: UseKanbanBoardProps) => {
    columns: KanbanColumn[];
    loading: boolean;
    error: Error;
    moveItem: (itemId: string, sourceColumnId: string, targetColumnId: string) => Promise<void>;
    refresh: () => Promise<void>;
};
export {};
//# sourceMappingURL=useKanbanBoard.d.ts.map