import { useState, useCallback, useEffect } from 'react';
import { KanbanColumn, DraggableItem, FeatureSuggestion, SuggestionStatus } from '../types.js';
import { SuggestionService } from '../services/types.js';

interface UseKanbanBoardProps {
  suggestionService: SuggestionService;
}

export const useKanbanBoard = ({ suggestionService }: UseKanbanBoardProps) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all suggestions and todos
      const [submitted, inReview, approved] = await Promise.all([
        suggestionService.getSuggestionsByStatus(SuggestionStatus.SUBMITTED),
        suggestionService.getSuggestionsByStatus(SuggestionStatus.UNDER_REVIEW),
        suggestionService.getSuggestionsByStatus(SuggestionStatus.APPROVED)
      ]);

      // Create columns
      setColumns([
        {
          id: 'pending',
          title: 'Pending',
          items: submitted as DraggableItem[] // Use type assertion to ensure compatibility
        },
        {
          id: 'in-review',
          title: 'In Review',
          items: inReview as DraggableItem[]
        },
        {
          id: 'approved',
          title: 'Approved',
          items: approved as DraggableItem[]
        }
      ]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load kanban items'));
    } finally {
      setLoading(false);
    }
  }, [suggestionService]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const moveItem = useCallback(async (
    itemId: string,
    sourceColumnId: string,
    targetColumnId: string
  ) => {
    try {
      // Map column IDs to status 
      const statusMap: Record<string, SuggestionStatus> = {
        'pending': SuggestionStatus.SUBMITTED,
        'in-review': SuggestionStatus.UNDER_REVIEW,
        'approved': SuggestionStatus.APPROVED
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
        const item = sourceColumn?.items.find((i: { id: string }) => i.id === itemId);

        if (!sourceColumn || !targetColumn || !item) {
          return prevColumns;
        }

        // Create a copy with the modified item that includes the new status
        const updatedItem = { ...item, status: newStatus } as DraggableItem;

        // Ensure we're returning properly typed columns
        return prevColumns.map(column => {
          if (column.id === sourceColumnId) {
            return {
              ...column,
              items: column.items.filter((i: { id: string }) => i.id !== itemId)
            };
          }
          if (column.id === targetColumnId) {
            return {
              ...column,
              items: [...column.items, updatedItem]
            };
          }
          return column;
        }) as KanbanColumn[]; // Explicitly cast to KanbanColumn[]
      });
    } catch (err) {
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
