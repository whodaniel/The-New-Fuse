import {
  FeatureSuggestion,
  TodoItem,
  SuggestionStatus,
  SuggestionService, // Assuming this is an interface you've defined
  TaskStatus,
} from '@the-new-fuse/hooks-types';
import {
  Column,
  DataType, // These seem to be from a custom library, ensure they are correctly imported
  ViewType,
  SelectOption,
  GroupBy,
  Sort,
  KanbanViewOptions
} from '@the-new-fuse/fairtable-core';

export interface KanbanColumn {
  id: string;
  title: string;
  items: (FeatureSuggestion | TodoItem)[];
}

export interface KanbanServiceProps {
  suggestionService: SuggestionService;
  retryAttempts?: number;
}

export interface FilterCriteria {
  searchTerm: string;
  priorities: string[];
  tags: string[];
}

export interface KanbanState {
  suggestions: FeatureSuggestion[];
  todos: TodoItem[];
  columns: KanbanColumn[];
  loading: boolean;
  error?: string;
}

export class KanbanService {
  private suggestionService: SuggestionService;
  private retryAttempts: number;
  private state: KanbanState = {
    suggestions: [],
    todos: [],
    columns: [],
    loading: true,
    error: undefined,
  };
  private filterCriteria: FilterCriteria = {
    searchTerm: '',
    priorities: [],
    tags: [],
  };

  constructor(props: KanbanServiceProps) {
    this.suggestionService = props.suggestionService;
    this.retryAttempts = props.retryAttempts ?? 3;
  }

  public async loadData(): Promise<void> {
    this.state.loading = true;
    this.state.error = undefined;
    try {
      const suggestions = await this.suggestionService.getSuggestions();
      const todos = await this.suggestionService.getAllTodos();
      this.state = {
        suggestions,
        todos,
        columns: this.buildColumns(suggestions, todos),
        loading: false,
      };
    } catch (error: any) {
      this.state.loading = false;
      this.state.error = error?.message || 'Failed to load Kanban data.';
      throw error;
    }
  }

  private buildColumns(suggestions: FeatureSuggestion[], todos: TodoItem[]): KanbanColumn[] {
    // Example: Group by status for suggestions and todos
    const statusMap: Record<string, KanbanColumn> = {};
    const allItems: (FeatureSuggestion | TodoItem)[] = [...suggestions, ...todos];
    for (const item of allItems) {
      const status = item.status || 'unknown';
      if (!statusMap[status]) {
        statusMap[status] = { id: status, title: status, items: [] };
      }
      statusMap[status].items.push(item);
    }
    // Ensure a consistent order of columns
    const orderedStatuses = [
        TaskStatus.PENDING,
        TaskStatus.IN_PROGRESS,
        SuggestionStatus.SUBMITTED,
        SuggestionStatus.UNDER_REVIEW,
        // SuggestionStatus.PLANNED, // Assuming PLANNED might be a status
        TaskStatus.COMPLETED,
    ];
    const columns = orderedStatuses
        .map(status => statusMap[status])
        .filter(Boolean);

    // Add any other status columns that might not be in the ordered list
    for (const status in statusMap) {
        if (!orderedStatuses.includes(status as any)) {
            columns.push(statusMap[status]);
        }
    }

    return columns;
  }

  public getFilteredColumns(): KanbanColumn[] {
    const { searchTerm } = this.filterCriteria;
    if (!searchTerm) {
      return this.state.columns;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return this.state.columns
      .map(column => ({
        ...column,
        items: column.items.filter(
          item =>
            item.title.toLowerCase().includes(lowerCaseSearchTerm) ||
            (item.description || '').toLowerCase().includes(lowerCaseSearchTerm)
        ),
      }))
      .filter(column => column.items.length > 0);
  }

  public getAirtableData() {
    const allItems = [...this.state.suggestions, ...this.state.todos];
    return {
      table: {
        rows: allItems.map(item => ({
          id: item.id,
          fields: {
            Title: item.title,
            Description: item.description,
            Status: item.status,
            Priority: (item as any).priority,
            Tags: (item as any).tags,
            CreatedAt: item.createdAt,
            UpdatedAt: item.updatedAt,
          },
        })),
      },
    };
  }

  public updateSearchTerm(term: string): void {
    this.filterCriteria.searchTerm = term;
  }

  public resetFilters(): void {
    this.filterCriteria.searchTerm = '';
    this.filterCriteria.priorities = [];
    this.filterCriteria.tags = [];
  }
}
