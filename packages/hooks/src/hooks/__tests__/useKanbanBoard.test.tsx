import { renderHook, act } from '@testing-library/react-hooks';
import { useKanbanBoard } from '../useKanbanBoard.js';
import { SuggestionStatus, TaskStatus, SuggestionService } from '../../types/index.js';

// Use jest.Mock to properly type the mock functions
const mockSuggestionService: jest.Mocked<SuggestionService> = {
  getSuggestionsByStatus: jest.fn(),
  getAllTodos: jest.fn(),
  updateSuggestionStatus: jest.fn(),
  updateTodoStatus: jest.fn(),
  convertToFeature: jest.fn(),
  deleteSuggestion: jest.fn(),
  duplicateSuggestion: jest.fn(),
  deleteTodo: jest.fn(),
  duplicateTodo: jest.fn(),
  getSuggestions: jest.fn(),
  getSuggestion: jest.fn(),
  createSuggestion: jest.fn(),
  updateSuggestion: jest.fn(),
  voteForSuggestion: jest.fn(),
  convertToTask: jest.fn()
} as jest.Mocked<SuggestionService>;

const mockSuggestions = [
  { 
    id: '1', 
    title: 'Test Suggestion', 
    description: 'Test description',
    status: SuggestionStatus.SUBMITTED,
    votes: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    tags: ['test'],
    priority: 'medium'
  },
  { 
    id: '2', 
    title: 'Another Suggestion', 
    description: 'Another description',
    status: SuggestionStatus.UNDER_REVIEW,
    votes: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-2',
    tags: ['feature'],
    priority: 'high'
  },
];

const mockTodos = [
  { 
    id: '1', 
    title: 'Test Todo', 
    description: 'Test todo description',
    completed: false,
    status: TaskStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    priority: 'medium'
  },
  { 
    id: '2', 
    title: 'Another Todo', 
    description: 'Another todo description',
    completed: false,
    status: TaskStatus.IN_PROGRESS,
    createdAt: new Date(),
    updatedAt: new Date(),
    priority: 'high'
  },
];

describe('useKanbanBoard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSuggestionService.getSuggestionsByStatus.mockResolvedValue(mockSuggestions);
    mockSuggestionService.getAllTodos.mockResolvedValue(mockTodos);
  });

  it('should initialize with empty state and load data', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useKanbanBoard({ suggestionService: mockSuggestionService })
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.todos).toEqual([]);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.suggestions).toEqual(mockSuggestions);
    expect(result.current.todos).toEqual(mockTodos);
  });

  it('should handle errors during data loading', async () => {
    const error = new Error('Failed to load');
    mockSuggestionService.getSuggestionsByStatus.mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() =>
      useKanbanBoard({ suggestionService: mockSuggestionService })
    );

    await waitForNextUpdate();

    expect(result.current.error).toBeTruthy();
    expect(result.current.loading).toBe(false);
  });

  it('should update suggestion status', async () => {
    const updatedSuggestion = { ...mockSuggestions[0], status: SuggestionStatus.UNDER_REVIEW };
    mockSuggestionService.updateSuggestionStatus.mockResolvedValue(updatedSuggestion);

    const { result, waitForNextUpdate } = renderHook(() =>
      useKanbanBoard({ suggestionService: mockSuggestionService })
    );

    await waitForNextUpdate();

    await act(async () => {
      await result.current.updateSuggestionStatus('1', SuggestionStatus.UNDER_REVIEW);
    });

    expect(mockSuggestionService.updateSuggestionStatus).toHaveBeenCalledWith(
      '1',
      SuggestionStatus.UNDER_REVIEW
    );
    expect(result.current.suggestions).toContainEqual(updatedSuggestion);
  });

  it('should update todo status', async () => {
    const updatedTodo = { ...mockTodos[0], status: TaskStatus.IN_PROGRESS };
    mockSuggestionService.updateTodoStatus.mockResolvedValue(updatedTodo);

    const { result, waitForNextUpdate } = renderHook(() =>
      useKanbanBoard({ suggestionService: mockSuggestionService })
    );

    await waitForNextUpdate();

    await act(async () => {
      await result.current.updateTodoStatus('1', TaskStatus.IN_PROGRESS);
    });

    expect(mockSuggestionService.updateTodoStatus).toHaveBeenCalledWith(
      '1',
      TaskStatus.IN_PROGRESS
    );
    expect(result.current.todos).toContainEqual(updatedTodo);
  });

  it('should handle drag and drop between columns', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useKanbanBoard({ suggestionService: mockSuggestionService })
    );

    await waitForNextUpdate();

    const dragResult = {
      source: { droppableId: 'suggestions', index: 0 },
      destination: { droppableId: 'under-review', index: 0 },
      draggableId: '1',
      type: 'DEFAULT' // Add the missing type property
    };

    await act(async () => {
      await result.current.handleDragEnd(dragResult);
    });

    expect(mockSuggestionService.updateSuggestionStatus).toHaveBeenCalledWith(
      '1',
      SuggestionStatus.UNDER_REVIEW
    );
  });

  it('should convert suggestion to feature', async () => {
    // Fix: Use a proper FeatureSuggestion object that matches the required type
    const convertedFeature = {
      id: '1',
      title: 'Converted Feature',
      description: 'This is a converted feature',
      status: SuggestionStatus.ACCEPTED,
      votes: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-1',
      tags: ['converted', 'feature'],
      priority: 'high'
    };
    
    mockSuggestionService.convertToFeature.mockResolvedValue(convertedFeature);

    const { result, waitForNextUpdate } = renderHook(() =>
      useKanbanBoard({ suggestionService: mockSuggestionService })
    );

    await waitForNextUpdate();

    await act(async () => {
      await result.current.convertSuggestionToFeature('1');
    });

    expect(mockSuggestionService.convertToFeature).toHaveBeenCalledWith('1');
    expect(result.current.suggestions).not.toContainEqual(mockSuggestions[0]);
  });
});