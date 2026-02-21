import { useCallback, useState, useEffect } from 'react';
import { SuggestionStatus, FeatureSuggestion, TodoItem } from '../types.js';

interface KanbanColumn {
  id: string;
  title: string;
  items: (FeatureSuggestion | TodoItem)[];
}

interface DragResult {
  source: {
    droppableId: string;
    index: number;
  };
  destination?: {
    droppableId: string;
    index: number;
  };
  draggableId: string;
}

interface UseKanbanBoardProps {
  suggestionService: any; // Replace with proper type
  initialSuggestions?: FeatureSuggestion[];
  initialTodos?: TodoItem[];
}

export const useKanbanBoard = ({
  suggestionService,
  initialSuggestions = [],
  initialTodos = []
}: UseKanbanBoardProps) => {
  const [suggestions, setSuggestions] = useState<FeatureSuggestion[]>(initialSuggestions);
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      id: 'submitted',
      title: 'Feature Suggestions',
      items: suggestions.filter(s => s.status === SuggestionStatus.SUBMITTED)
    },
    {
      id: 'under-review',
      title: 'Under Review',
      items: suggestions.filter(s => s.status === SuggestionStatus.UNDER_REVIEW)
    },
    {
      id: 'todo',
      title: 'Todo',
      items: todos.filter(t => t.status === 'TODO')
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      items: todos.filter(t => t.status === 'IN_PROGRESS')
    },
    {
      id: 'done',
      title: 'Done',
      items: todos.filter(t => t.status === 'DONE')
    }
  ]);

  const handleDragEnd = useCallback(async (result: DragResult): Promise<void> => {
    // ... rest of handleDragEnd implementation
  }, [columns, updateSuggestionStatus, updateTodoStatus]);

  return {
    suggestions,
    todos,
    loading,
    error,
    updateSuggestionStatus,
    updateTodoStatus,
    convertSuggestionToFeature,
    refresh: loadData,
    columns,
    handleDragEnd
  };
};