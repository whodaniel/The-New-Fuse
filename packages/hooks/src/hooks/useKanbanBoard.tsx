import { useCallback, useState, useEffect, useMemo } from 'react';
import {
  FeatureSuggestion,
  TodoItem,
  SuggestionStatus,
  SuggestionService,
  TaskStatus
} from '../types/index.js';
import { useUndoRedo } from './useUndoRedo.js';
import {
  Table,
  View,
  Row,
  Column,
  AppState,
  KanbanViewOptions,
  DataType,
  ViewType
} from '@the-new-fuse/fairtable-core';

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

interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
}

interface FilterCriteria {
  searchTerm: string;
  priorities: string[];
  tags: string[];
}

interface KanbanState {
  suggestions: FeatureSuggestion[];
  todos: TodoItem[];
}

export const useKanbanBoard = ({ 
  suggestionService, 
  initialSuggestions = [], 
  initialTodos = [],
  retryAttempts = 3
}: UseKanbanBoardProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<FilterCriteria>({
    searchTerm: '',
    priorities: [],
    tags: []
  });

  const { 
    state: { suggestions, todos },
    canUndo,
    canRedo,
    undo,
    redo,
    set: setState,
    reset: resetState
  } = useUndoRedo<KanbanState>({
    suggestions: initialSuggestions,
    todos: initialTodos
  });

  const retryConfig: RetryConfig = useMemo(() => ({
    maxAttempts: retryAttempts,
    delayMs: 1000,
  }), [retryAttempts]);

  const retryOperation = useCallback(async <T,>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> => {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < config.maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, config.delayMs));
        }
      }
    }
    throw lastError;
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [suggestionsData, todosData] = await Promise.all([
        retryOperation(
          () => suggestionService.getSuggestionsByStatus(SuggestionStatus.SUBMITTED),
          retryConfig
        ),
        retryOperation(
          () => suggestionService.getAllTodos(),
          retryConfig
        )
      ]);
      resetState({
        suggestions: suggestionsData as FeatureSuggestion[],
        todos: todosData as TodoItem[]
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load kanban data'));
    } finally {
      setLoading(false);
    }
  }, [suggestionService, retryOperation, retryConfig, resetState]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateSuggestionStatus = useCallback(async (
    id: string,
    status: SuggestionStatus
  ): Promise<void> => {
    try {
      setError(null);
      const updatedSuggestion = await retryOperation(
        () => suggestionService.updateSuggestionStatus(id, status),
        retryConfig
      );
      setState({
        suggestions: suggestions.map(s => s.id === id ? updatedSuggestion : s),
        todos
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update suggestion status'));
      throw err;
    }
  }, [suggestionService, retryOperation, retryConfig, setState, suggestions, todos]);

  const updateTodoStatus = useCallback(async (
    id: string,
    status: TaskStatus
  ): Promise<void> => {
    try {
      setError(null);
      const updatedTodo = await retryOperation(
        () => suggestionService.updateTodoStatus(id, status),
        retryConfig
      );
      setState({
        suggestions,
        todos: todos.map(t => t.id === id ? updatedTodo : t)
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update todo status'));
      throw err;
    }
  }, [suggestionService, retryOperation, retryConfig, setState, suggestions, todos]);

  const convertSuggestionToFeature = useCallback(async (
    suggestionId: string
  ): Promise<FeatureSuggestion> => {
    try {
      setError(null);
      const convertedSuggestion = await retryOperation(
        () => suggestionService.convertToFeature(suggestionId),
        retryConfig
      );
      setState({
        suggestions: suggestions.filter(s => s.id !== suggestionId),
        todos
      });
      return convertedSuggestion;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to convert suggestion to feature'));
      throw err;
    }
  }, [suggestionService, retryOperation, retryConfig, setState, suggestions, todos]);

  const filterItems = useCallback(<T extends FeatureSuggestion | TodoItem>(items: T[], criteria: FilterCriteria) => {
    return items.filter(item => {
      // Search term filter
      const matchesSearchTerm = !criteria.searchTerm || 
        item.title.toLowerCase().includes(criteria.searchTerm.toLowerCase()) || 
        ('description' in item && item.description && item.description.toLowerCase().includes(criteria.searchTerm.toLowerCase()));
      
      // Priority filter
      const matchesPriority = criteria.priorities.length === 0 || 
        (item.priority && criteria.priorities.includes(item.priority.toLowerCase()));
      
      // Tags filter (only for FeatureSuggestion)
      const matchesTags = criteria.tags.length === 0 || 
        ('tags' in item && item.tags && criteria.tags.every(tag => item.tags!.includes(tag)));
      
      return matchesSearchTerm && matchesPriority && matchesTags;
    });
  }, []);

  const filteredColumns = useMemo((): KanbanColumn[] => [
    {
      id: 'suggestions',
      title: 'Feature Suggestions',
      items: filterItems(
        suggestions.filter(s => s.status === SuggestionStatus.SUBMITTED),
        filters
      ),
    },
    {
      id: 'under-review',
      title: 'Under Review',
      items: filterItems(
        suggestions.filter(s => s.status === SuggestionStatus.UNDER_REVIEW),
        filters
      ),
    },
    {
      id: 'todo',
      title: 'To Do',
      items: filterItems(
        todos.filter(t => t.status === TaskStatus.PENDING),
        filters
      ),
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      items: filterItems(
        todos.filter(t => t.status === TaskStatus.IN_PROGRESS),
        filters
      ),
    },
    {
      id: 'done',
      title: 'Done',
      items: filterItems(
        todos.filter(t => t.status === TaskStatus.COMPLETED),
        filters
      ),
    }
  ], [suggestions, todos, filters, filterItems]);

  const availableTags = useMemo(() => {
    const allTags = new Set<string>();
    suggestions.forEach((suggestion: FeatureSuggestion) => {
      if (suggestion.tags) {
        suggestion.tags.forEach((tag: string) => allTags.add(tag));
      }
    });
    return Array.from(allTags);
  }, [suggestions]);

  const updateSearchTerm = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const updatePriorityFilter = useCallback((priorities: string[]) => {
    setFilters(prev => ({ ...prev, priorities }));
  }, []);

  const updateTagsFilter = useCallback((tags: string[]) => {
    setFilters(prev => ({ ...prev, tags }));
  }, []);

  const handleDragEnd = useCallback(async (result: DragResult): Promise<void> => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) {
      return; // Same column, no status change needed
    }

    try {
      setError(null);
      if (source.droppableId === 'suggestions' || destination.droppableId === 'under-review') {
        const newStatus = destination.droppableId === 'under-review' 
          ? SuggestionStatus.UNDER_REVIEW 
          : SuggestionStatus.SUBMITTED;
        await updateSuggestionStatus(draggableId, newStatus);
      } else {
        const newStatus = destination.droppableId === 'in-progress' 
          ? TaskStatus.IN_PROGRESS 
          : destination.droppableId === 'done'
            ? TaskStatus.COMPLETED
            : TaskStatus.PENDING;
        await updateTodoStatus(draggableId, newStatus);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update item status'));
      throw err;
    }
  }, [updateSuggestionStatus, updateTodoStatus]);

  const handleBatchOperation = useCallback(async (
    operation: 'move' | 'delete' | 'duplicate',
    itemIds: string[],
    newStatus?: SuggestionStatus | TaskStatus
  ): Promise<void> => {
    try {
      setError(null);
      const isSuggestion = (id: string) => suggestions.some(s => s.id === id);
      
      const updates = await Promise.all(
        itemIds.map(async (id) => {
          if (operation === 'move' && newStatus) {
            return isSuggestion(id)
              ? suggestionService.updateSuggestionStatus(id, newStatus as SuggestionStatus)
              : suggestionService.updateTodoStatus(id, newStatus as TaskStatus);
          } else if (operation === 'delete') {
            return isSuggestion(id)
              ? suggestionService.deleteSuggestion(id)
              : suggestionService.deleteTodo(id);
          } else if (operation === 'duplicate') {
            return isSuggestion(id)
              ? suggestionService.duplicateSuggestion(id)
              : suggestionService.duplicateTodo(id);
          }
        })
      );

      const newState = { suggestions, todos };
      updates.forEach((update: any) => {
        if (!update) return;
        
        if ('status' in update) {
          if (isSuggestion(update.id)) {
            newState.suggestions = newState.suggestions.map(s => 
              s.id === update.id ? update : s
            );
          } else {
            newState.todos = newState.todos.map(t => 
              t.id === update.id ? update : t
            );
          }
        } else if (operation === 'delete') {
          if (isSuggestion(update.id)) {
            newState.suggestions = newState.suggestions.filter(s => 
              s.id !== update.id
            );
          } else {
            newState.todos = newState.todos.filter(t => 
              t.id !== update.id
            );
          }
        } else if (operation === 'duplicate') {
          if (isSuggestion(update.id)) {
            newState.suggestions = [...newState.suggestions, update];
          } else {
            newState.todos = [...newState.todos, update];
          }
        }
      });

      setState(newState);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(`Failed to perform batch ${operation}`));
      throw err;
    }
  }, [suggestionService, setState, suggestions, todos]);

  // Add airtable-compatible data structures for gradual migration
  const airtableData = useMemo(() => {
    // Create columns for the airtable
    const titleColumn: Column = {
      id: 'title',
      name: 'Title',
      type: DataType.TEXT,
      width: 200
    };

    const descriptionColumn: Column = {
      id: 'description',
      name: 'Description',
      type: DataType.LONG_TEXT,
      width: 300
    };

    const priorityColumn: Column = {
      id: 'priority',
      name: 'Priority',
      type: DataType.SINGLE_SELECT,
      width: 120,
      options: [
        { id: 'LOW', name: 'Low', colorClass: 'bg-blue-100 text-blue-800' },
        { id: 'MEDIUM', name: 'Medium', colorClass: 'bg-yellow-100 text-yellow-800' },
        { id: 'HIGH', name: 'High', colorClass: 'bg-orange-100 text-orange-800' },
        { id: 'CRITICAL', name: 'Critical', colorClass: 'bg-red-100 text-red-800' }
      ]
    };

    const statusColumn: Column = {
      id: 'status',
      name: 'Status',
      type: DataType.SINGLE_SELECT,
      width: 150,
      options: filteredColumns.map(col => ({
        id: col.id,
        name: col.title,
        colorClass: 'bg-gray-100 text-gray-800'
      }))
    };

    const tableColumns = [titleColumn, descriptionColumn, priorityColumn, statusColumn];

    // Convert legacy items to rows
    const rows: Row[] = [];
    filteredColumns.forEach(column => {
      column.items.forEach(item => {
        const suggestion = item as FeatureSuggestion;
        const todo = item as TodoItem;
        
        rows.push({
          id: item.id,
          data: {
            title: item.title,
            description: suggestion.description || todo.description || '',
            priority: suggestion.priority || todo.priority || 'MEDIUM',
            status: column.id,
            // Preserve additional properties
            ...Object.fromEntries(
              Object.entries(item).filter(([key]) =>
                !['id', 'title', 'description', 'priority'].includes(key)
              )
            )
          },
          createdAt: suggestion.createdAt ? (suggestion.createdAt instanceof Date ? suggestion.createdAt.toISOString() : suggestion.createdAt) :
                     todo.createdAt ? (todo.createdAt instanceof Date ? todo.createdAt.toISOString() : todo.createdAt) :
                     new Date().toISOString(),
          updatedAt: suggestion.updatedAt ? (suggestion.updatedAt instanceof Date ? suggestion.updatedAt.toISOString() : suggestion.updatedAt) :
                     todo.updatedAt ? (todo.updatedAt instanceof Date ? todo.updatedAt.toISOString() : todo.updatedAt) :
                     new Date().toISOString(),
          parentId: null,
          depth: 0,
          isCollapsed: false
        });
      });
    });

    // Create table
    const table: Table = {
      id: 'kanban-board-table',
      name: 'Kanban Board',
      columns: tableColumns,
      rows,
      columnOrder: ['title', 'description', 'priority', 'status'],
      views: [],
      activeViewId: 'kanban-view'
    };

    // Create kanban view
    const kanbanViewOptions: KanbanViewOptions = {
      groupByColumnId: 'status'
    };

    const view: View = {
      id: 'kanban-view',
      name: 'Kanban View',
      type: ViewType.KANBAN,
      filters: [],
      sorts: [],
      groupBy: [],
      columnOrder: ['title', 'description', 'priority'],
      columnVisibility: {
        title: true,
        description: true,
        priority: true,
        status: false // Hidden since it's used for grouping
      },
      viewSpecificOptions: kanbanViewOptions
    };

    table.views = [view];

    const appState: AppState = {
      tables: [table],
      activeTableId: table.id
    };

    return {
      table,
      view,
      appState,
      columnsToDisplay: [titleColumn, descriptionColumn, priorityColumn],
      rowsToDisplay: rows
    };
  }, [filteredColumns, suggestions, todos]);

  // Show migration notice in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.info(
        '🔄 [MIGRATION] useKanbanBoard now provides airtable-compatible data via .airtableData property. ' +
        'Consider migrating to direct airtable integration for better performance. ' +
        'See migration guide: docs/migration/kanban-board.md'
      );
    }
  }, []);

  return {
    // Legacy API
    suggestions,
    todos,
    loading,
    error,
    updateSuggestionStatus,
    updateTodoStatus,
    convertSuggestionToFeature,
    handleBatchOperation,
    refresh: loadData,
    columns: filteredColumns,
    handleDragEnd,
    filters,
    availableTags,
    updateSearchTerm,
    updatePriorityFilter,
    updateTagsFilter,
    canUndo,
    canRedo,
    undo,
    redo,
    // New airtable-compatible API
    airtableData
  };
};
