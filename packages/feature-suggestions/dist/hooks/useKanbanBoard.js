"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useKanbanBoard = void 0;
const react_1 = require("react");
const types_1 = require("../types");
const useKanbanBoard = ({ suggestionService }) => {
    const [columns, setColumns] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const loadItems = (0, react_1.useCallback)(async () => {
        try {
            setLoading(true);
            setError(null);
            // Get all suggestions and todos
            const [submitted, inReview, approved] = await Promise.all([
                suggestionService.getSuggestionsByStatus(types_1.SuggestionStatus.SUBMITTED),
                suggestionService.getSuggestionsByStatus(types_1.SuggestionStatus.UNDER_REVIEW),
                suggestionService.getSuggestionsByStatus(types_1.SuggestionStatus.APPROVED)
            ]);
            // Create columns
            setColumns([
                {
                    id: 'pending',
                    title: 'Pending',
                    items: submitted // Use type assertion to ensure compatibility
                },
                {
                    id: 'in-review',
                    title: 'In Review',
                    items: inReview
                },
                {
                    id: 'approved',
                    title: 'Approved',
                    items: approved
                }
            ]);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load kanban items'));
        }
        finally {
            setLoading(false);
        }
    }, [suggestionService]);
    (0, react_1.useEffect)(() => {
        loadItems();
    }, [loadItems]);
    const moveItem = (0, react_1.useCallback)(async (itemId, sourceColumnId, targetColumnId) => {
        try {
            // Map column IDs to status 
            const statusMap = {
                'pending': types_1.SuggestionStatus.SUBMITTED,
                'in-review': types_1.SuggestionStatus.UNDER_REVIEW,
                'approved': types_1.SuggestionStatus.APPROVED
            };
            const newStatus = statusMap[targetColumnId];
            if (!newStatus) {
                throw new Error(`Invalid target column: ${targetColumnId}`);
            }
            // Update item status in backend
            await suggestionService.updateSuggestionStatus(itemId, newStatus);
            // Update local state
            setColumns(prevColumns => {
                const sourceColumn = prevColumns.find(c => c.id === sourceColumnId);
                const targetColumn = prevColumns.find(c => c.id === targetColumnId);
                const item = sourceColumn?.items.find((i) => i.id === itemId);
                if (!sourceColumn || !targetColumn || !item) {
                    return prevColumns;
                }
                // Create a copy with the modified item that includes the new status
                const updatedItem = { ...item, status: newStatus };
                // Ensure we're returning properly typed columns
                return prevColumns.map(column => {
                    if (column.id === sourceColumnId) {
                        return {
                            ...column,
                            items: column.items.filter((i) => i.id !== itemId)
                        };
                    }
                    if (column.id === targetColumnId) {
                        return {
                            ...column,
                            items: [...column.items, updatedItem]
                        };
                    }
                    return column;
                }); // Explicitly cast to KanbanColumn[]
            });
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to move item'));
            throw err;
        }
    }, [suggestionService]);
    return {
        columns,
        loading,
        error,
        moveItem,
        refresh: loadItems
    };
};
exports.useKanbanBoard = useKanbanBoard;
//# sourceMappingURL=useKanbanBoard.js.map