import * as vscode from 'vscode';

// Placeholder: Adjust these import paths based on your actual project structure
// Assuming types are in a shared package or accessible path
import {
  FeatureSuggestion,
  TodoItem,
  SuggestionStatus,
  SuggestionService,
  TaskStatus,
  // Assuming Priority type exists if used directly, otherwise it's string
} from '@the-new-fuse/hooks-types'; // Replace with actual path to types

import {
  Table,
  View,
  Row,
  Column,
  AppState,
  KanbanViewOptions,
  DataType,
  ViewType,
  SelectOption,
} from '@the-new-fuse/fairtable-core'; // Ensure this package is accessible

interface KanbanColumn {
  id: string;
  title: string;
  items: (FeatureSuggestion | TodoItem)[];
}

interface KanbanServiceProps {
  suggestionService: SuggestionService;
  retryAttempts?: number;
}

interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
}

interface FilterCriteria {
  searchTerm: string;
  priorities: string[]; // Assuming priorities are strings like 'LOW', 'MEDIUM'
  tags: string[];
}

interface KanbanState {
  suggestions: FeatureSuggestion[];
  todos: TodoItem[];
}

export class KanbanService {
  private suggestionService: SuggestionService;
  private state: KanbanState = { suggestions: [], todos: [] };
  private filters: FilterCriteria = { searchTerm: '', priorities: [], tags: [] };
  private retryConfig: RetryConfig;

  public loading: boolean = false;
  public error: Error | null = null;

  constructor(props: KanbanServiceProps) {
    this.suggestionService = props.suggestionService;
    this.retryConfig = {
      maxAttempts: props.retryAttempts || 3,
      delayMs: 1000,
    };
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    config: RetryConfig = this.retryConfig
  ): Promise<T> {
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
    throw lastError || new Error('Retry operation failed after multiple attempts.');
  }

  public async loadData(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      // Assuming getSuggestionsByStatus(null) or a dedicated method gets all relevant suggestions
      // For simplicity, let's assume we fetch all and then filter, or adjust as needed.
      const [suggestionsData, todosData] = await Promise.all([
        this.retryOperation(() => this.suggestionService.getSuggestionsByStatus(null)), // Or fetch all types
        this.retryOperation(() => this.suggestionService.getAllTodos()),
      ]);
      this.state = {
        suggestions: (suggestionsData as FeatureSuggestion[]) || [],
        todos: (todosData as TodoItem[]) || [],
      };
    } catch (err) {
      this.error = err instanceof Error ? err : new Error('Failed to load kanban data');
      console.error('[KanbanService] Error loading data:', this.error);
      throw this.error;
    } finally {
      this.loading = false;
    }
  }

  public async updateSuggestionStatus(id: string, status: SuggestionStatus): Promise<void> {
    try {
      this.error = null;
      const updatedSuggestion = await this.retryOperation(() =>
        this.suggestionService.updateSuggestionStatus(id, status)
      );
      this.state.suggestions = this.state.suggestions.map(s =>
        s.id === id ? updatedSuggestion : s
      );
    } catch (err) {
      this.error = err instanceof Error ? err : new Error('Failed to update suggestion status');
      console.error('[KanbanService] Error updating suggestion status:', this.error);
      throw this.error;
    }
  }

  public async updateTodoStatus(id: string, status: TaskStatus): Promise<void> {
    try {
      this.error = null;
      const updatedTodo = await this.retryOperation(() =>
        this.suggestionService.updateTodoStatus(id, status)
      );
      this.state.todos = this.state.todos.map(t => (t.id === id ? updatedTodo : t));
    } catch (err) {
      this.error = err instanceof Error ? err : new Error('Failed to update todo status');
      console.error('[KanbanService] Error updating todo status:', this.error);
      throw this.error;
    }
  }
  
  public async moveItem(itemId: string, newColumnId: string): Promise<void> {
    const item = [...this.state.suggestions, ...this.state.todos].find(i => i.id === itemId);
    if (!item) {
        throw new Error(`Item with id ${itemId} not found.`);
    }

    // Determine if it's a suggestion or todo to call the correct update method
    const isSuggestion = this.state.suggestions.some(s => s.id === itemId);

    try {
        if (isSuggestion) {
            let newStatus: SuggestionStatus;
            if (newColumnId === 'suggestions') newStatus = SuggestionStatus.SUBMITTED;
            else if (newColumnId === 'under-review') newStatus = SuggestionStatus.UNDER_REVIEW;
            // Add other suggestion statuses if your Kanban board has more columns for suggestions
            else { 
                console.warn(\`[KanbanService] Unknown column ID '\${newColumnId}' for suggestion '\${itemId}'.\`);
                return;
            }
            await this.updateSuggestionStatus(itemId, newStatus);
        } else { // It's a TodoItem
            let newStatus: TaskStatus;
            if (newColumnId === 'todo') newStatus = TaskStatus.PENDING;
            else if (newColumnId === 'in-progress') newStatus = TaskStatus.IN_PROGRESS;
            else if (newColumnId === 'done') newStatus = TaskStatus.COMPLETED;
            else {
                console.warn(\`[KanbanService] Unknown column ID '\${newColumnId}' for todo '\${itemId}'.\`);
                return;
            }
            await this.updateTodoStatus(itemId, newStatus);
        }
    } catch (error) {
        console.error(\`[KanbanService] Failed to move item \${itemId} to \${newColumnId}:\`, error);
        throw error; // Re-throw to allow caller to handle
    }
  }

  public async convertSuggestionToFeature(suggestionId: string): Promise<FeatureSuggestion | null> {
    try {
      this.error = null;
      // Assuming suggestionService.convertToFeature exists and works as in the hook
      const convertedSuggestion = await this.retryOperation(() =>
        this.suggestionService.convertToFeature(suggestionId)
      );
      // Update state: remove from suggestions, potentially add to a features list if managed here
      this.state.suggestions = this.state.suggestions.filter(s => s.id !== suggestionId);
      // If converted features are also part of 'todos' or a separate list, handle that.
      // For now, just returning it.
      return convertedSuggestion;
    } catch (err) {
      this.error = err instanceof Error ? err : new Error('Failed to convert suggestion to feature');
      console.error('[KanbanService] Error converting suggestion:', this.error);
      throw this.error;
    }
  }

  private filterItems<T extends FeatureSuggestion | TodoItem>(
    items: T[],
    criteria: FilterCriteria
  ): T[] {
    return items.filter(item => {
      const searchTermLower = criteria.searchTerm.toLowerCase();
      const matchesSearchTerm =
        !criteria.searchTerm ||
        item.title.toLowerCase().includes(searchTermLower) ||
        ('description' in item &&
          item.description &&
          item.description.toLowerCase().includes(searchTermLower));

      const itemPriorityLower = item.priority?.toLowerCase();
      const matchesPriority =
        criteria.priorities.length === 0 ||
        (itemPriorityLower && criteria.priorities.some(p => p.toLowerCase() === itemPriorityLower));
        
      const itemTags = 'tags' in item && Array.isArray(item.tags) ? item.tags : [];
      const matchesTags =
        criteria.tags.length === 0 ||
        criteria.tags.every(tag => itemTags.map(t => t.toLowerCase()).includes(tag.toLowerCase()));

      return matchesSearchTerm && matchesPriority && matchesTags;
    });
  }

  public getFilteredColumns(): KanbanColumn[] {
    return [
      {
        id: 'suggestions',
        title: 'Feature Suggestions',
        items: this.filterItems(
          this.state.suggestions.filter(s => s.status === SuggestionStatus.SUBMITTED),
          this.filters
        ),
      },
      {
        id: 'under-review',
        title: 'Under Review',
        items: this.filterItems(
          this.state.suggestions.filter(s => s.status === SuggestionStatus.UNDER_REVIEW),
          this.filters
        ),
      },
      {
        id: 'todo',
        title: 'To Do',
        items: this.filterItems(
          this.state.todos.filter(t => t.status === TaskStatus.PENDING),
          this.filters
        ),
      },
      {
        id: 'in-progress',
        title: 'In Progress',
        items: this.filterItems(
          this.state.todos.filter(t => t.status === TaskStatus.IN_PROGRESS),
          this.filters
        ),
      },
      {
        id: 'done',
        title: 'Done',
        items: this.filterItems(
          this.state.todos.filter(t => t.status === TaskStatus.COMPLETED),
          this.filters
        ),
      },
    ];
  }

  public getAvailableTags(): string[] {
    const allTags = new Set<string>();
    this.state.suggestions.forEach((suggestion: FeatureSuggestion) => {
      if (suggestion.tags) {
        suggestion.tags.forEach((tag: string) => allTags.add(tag));
      }
    });
    // Add tags from todos if they have them
    this.state.todos.forEach((todo: TodoItem) => {
        if ('tags' in todo && Array.isArray((todo as any).tags)) {
            (todo as any).tags.forEach((tag: string) => allTags.add(tag));
        }
    });
    return Array.from(allTags);
  }

  public updateSearchTerm(term: string): void {
    this.filters.searchTerm = term;
    // Potentially trigger an event or callback if external components need to react
  }

  public updatePriorityFilter(priorities: string[]): void {
    this.filters.priorities = priorities;
  }

  public updateTagsFilter(tags: string[]): void {
    this.filters.tags = tags;
  }
  
  public resetFilters(): void {
    this.filters = { searchTerm: '', priorities: [], tags: [] };
  }

  public async handleBatchOperation(
    operation: 'move' | 'delete' | 'duplicate',
    itemIds: string[],
    newStatus?: SuggestionStatus | TaskStatus // Relevant for 'move'
  ): Promise<void> {
    try {
      this.error = null;
      const isSuggestion = (id: string) => this.state.suggestions.some(s => s.id === id);

      // Note: SuggestionService in the hook had deleteSuggestion, duplicateSuggestion etc.
      // Ensure your actual SuggestionService interface supports these.
      // The Promise.all structure from the hook is good.

      const results = await Promise.allSettled(
        itemIds.map(async (id) => {
          const itemIsSuggestion = isSuggestion(id);
          if (operation === 'move' && newStatus) {
            return itemIsSuggestion
              ? this.suggestionService.updateSuggestionStatus(id, newStatus as SuggestionStatus)
              : this.suggestionService.updateTodoStatus(id, newStatus as TaskStatus);
          } else if (operation === 'delete') {
            // Assuming these methods exist on suggestionService
            return itemIsSuggestion
              ? (this.suggestionService as any).deleteSuggestion(id) 
              : (this.suggestionService as any).deleteTodo(id);
          } else if (operation === 'duplicate') {
            // Assuming these methods exist on suggestionService
            return itemIsSuggestion
              ? (this.suggestionService as any).duplicateSuggestion(id)
              : (this.suggestionService as any).duplicateTodo(id);
          }
          return Promise.resolve(null); // Should not happen if op is valid
        })
      );
      
      // Process results and update local state
      const newState = { ...this.state };
      results.forEach((result, index) => {
        const itemId = itemIds[index];
        if (result.status === 'fulfilled' && result.value) {
          const updatedOrNewItem = result.value as any; // Cast needed as return type varies
          if (operation === 'move') {
            if (isSuggestion(itemId)) {
              newState.suggestions = newState.suggestions.map(s => s.id === itemId ? updatedOrNewItem : s);
            } else {
              newState.todos = newState.todos.map(t => t.id === itemId ? updatedOrNewItem : t);
            }
          } else if (operation === 'duplicate') {
             if (isSuggestion(itemId)) {
              newState.suggestions = [...newState.suggestions, updatedOrNewItem];
            } else {
              newState.todos = [...newState.todos, updatedOrNewItem];
            }
          }
        } else if (result.status === 'rejected') {
            console.error(\`[KanbanService] Batch operation '\${operation}' failed for item '\${itemId}':\`, result.reason);
        }
      });

      // For delete, filter out items from local state if service call was successful (or assume success if no error)
      if (operation === 'delete') {
        const successfullyDeletedIds = itemIds.filter((id, index) => results[index].status === 'fulfilled'); // Or based on service response
        newState.suggestions = newState.suggestions.filter(s => !successfullyDeletedIds.includes(s.id));
        newState.todos = newState.todos.filter(t => !successfullyDeletedIds.includes(t.id));
      }
      this.state = newState;

    } catch (err) {
      this.error = err instanceof Error ? err : new Error(\`Failed to perform batch \${operation}\`);
      console.error(\`[KanbanService] Error in batch \${operation}:\`, this.error);
      throw this.error;
    }
  }

  public getAirtableData(): {
    table: Table;
    view: View;
    appState: AppState;
    columnsToDisplay: Column[];
    rowsToDisplay: Row[];
  } {
    const filteredCols = this.getFilteredColumns();

    const titleColumn: Column = { id: 'title', name: 'Title', type: DataType.TEXT, width: 200 };
    const descriptionColumn: Column = { id: 'description', name: 'Description', type: DataType.LONG_TEXT, width: 300 };
    const priorityOptions: SelectOption[] = [
        { id: 'LOW', name: 'Low', colorClass: 'bg-blue-100 text-blue-800' },
        { id: 'MEDIUM', name: 'Medium', colorClass: 'bg-yellow-100 text-yellow-800' },
        { id: 'HIGH', name: 'High', colorClass: 'bg-orange-100 text-orange-800' },
        { id: 'CRITICAL', name: 'Critical', colorClass: 'bg-red-100 text-red-800' }
    ];
    const priorityColumn: Column = {
      id: 'priority', name: 'Priority', type: DataType.SINGLE_SELECT, width: 120, options: priorityOptions
    };
    const statusOptions: SelectOption[] = filteredCols.map(col => ({
        id: col.id, name: col.title, colorClass: 'bg-gray-100 text-gray-800' // Define colors as needed
    }));
    const statusColumn: Column = {
      id: 'status', name: 'Status', type: DataType.SINGLE_SELECT, width: 150, options: statusOptions
    };
    // Add tags column if needed for Airtable view
    const tagsColumn: Column = { id: 'tags', name: 'Tags', type: DataType.MULTI_SELECT, width: 200, options: this.getAvailableTags().map(tag => ({id: tag, name: tag})) };


    const tableColumns = [titleColumn, descriptionColumn, priorityColumn, statusColumn, tagsColumn];

    const rows: Row[] = [];
    filteredCols.forEach(column => {
      column.items.forEach(item => {
        const suggestion = item as FeatureSuggestion; // Type assertion
        const todo = item as TodoItem; // Type assertion
        
        let itemDescription = '';
        if ('description' in item && item.description) {
            itemDescription = item.description;
        }

        let itemTags: string[] = [];
        if ('tags' in item && Array.isArray(item.tags)) {
            itemTags = item.tags;
        }


        rows.push({
          id: item.id,
          data: {
            title: item.title,
            description: itemDescription,
            priority: item.priority || 'MEDIUM', // Default priority
            status: column.id, // The column.id represents the status in this Kanban setup
            tags: itemTags,
            // Preserve additional properties not explicitly mapped
            ...Object.fromEntries(
              Object.entries(item).filter(([key]) =>
                !['id', 'title', 'description', 'priority', 'status', 'tags'].includes(key)
              )
            )
          },
          createdAt: (item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt) || new Date().toISOString(),
          updatedAt: (item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt) || new Date().toISOString(),
          parentId: null,
          depth: 0,
          isCollapsed: false,
        });
      });
    });

    const table: Table = {
      id: 'kanban-board-table',
      name: 'Kanban Board',
      columns: tableColumns,
      rows,
      columnOrder: ['title', 'description', 'priority', 'status', 'tags'],
      views: [],
      activeViewId: 'kanban-view',
    };

    const kanbanViewOptions: KanbanViewOptions = { groupByColumnId: 'status' };
    const kanbanView: View = {
      id: 'kanban-view',
      name: 'Kanban View',
      type: ViewType.KANBAN,
      filters: [],
      sorts: [],
      groupBy: [{ columnId: 'status', direction: 'ASC' }], // Group by status
      columnOrder: ['title', 'description', 'priority', 'tags'],
      columnVisibility: { title: true, description: true, priority: true, status: false, tags: true },
      viewSpecificOptions: kanbanViewOptions,
    };
    
    // Example: A simple list view
    const listView: View = {
        id: 'list-view',
        name: 'All Items List',
        type: ViewType.TABLE, // Assuming TABLE is the type for a simple list/grid
        filters: [],
        sorts: [{ columnId: 'title', direction: 'ASC' }],
        groupBy: [],
        columnOrder: ['title', 'status', 'priority', 'tags', 'description'],
        columnVisibility: { title: true, status: true, priority: true, tags: true, description: true },
    };

    table.views = [kanbanView, listView];
    table.activeViewId = kanbanView.id; // Default to Kanban view

    const appState: AppState = { tables: [table], activeTableId: table.id };

    return {
      table,
      view: kanbanView, // Or return active view based on table.activeViewId
      appState,
      columnsToDisplay: [titleColumn, descriptionColumn, priorityColumn, tagsColumn], // Columns for a grid/list display
      rowsToDisplay: rows,
    };
  }
}

// Example of how SuggestionService might be defined (ensure this matches your actual service)
// interface SuggestionService {
//   getSuggestionsByStatus(status: SuggestionStatus | null): Promise<FeatureSuggestion[]>;
//   getAllTodos(): Promise<TodoItem[]>;
//   updateSuggestionStatus(id: string, status: SuggestionStatus): Promise<FeatureSuggestion>;
//   updateTodoStatus(id: string, status: TaskStatus): Promise<TodoItem>;
//   convertToFeature(suggestionId: string): Promise<FeatureSuggestion>;
//   deleteSuggestion?(id: string): Promise<{id: string}>; // Example
//   deleteTodo?(id: string): Promise<{id: string}>; // Example
//   duplicateSuggestion?(id: string): Promise<FeatureSuggestion>; // Example
//   duplicateTodo?(id: string): Promise<TodoItem>; // Example
// }
