import { renderHook, act } from '@testing-library/react-hooks';
import { useFeatureSuggestions } from './useFeatureSuggestions.js';
import { SuggestionStatus, SuggestionPriority } from '../types.js';

// Mock suggestion service
const mockSuggestionService = {
  getPopularSuggestions: jest.fn(),
  getSuggestionsByStatus: jest.fn(),
  getAllTodos: jest.fn(),
  updateSuggestionStatus: jest.fn(),
  updateTodoStatus: jest.fn(),
  submitSuggestion: jest.fn(),
  voteSuggestion: jest.fn(),
  convertToFeature: jest.fn(),
  addTodo: jest.fn(),
  addComment: jest.fn()
};

describe('useFeatureSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load suggestions on init', async () => {
    const mockSuggestions = [
      {
        id: '1',
        title: 'Test Suggestion',
        description: 'Test Description',
        submittedBy: 'user1',
        submittedAt: new Date(),
        status: SuggestionStatus.PENDING,
        priority: SuggestionPriority.MEDIUM,
        votes: 5,
        tags: ['test'],
        relatedTodoIds: [],
        updatedAt: new Date()
      }
    ];

    mockSuggestionService.getPopularSuggestions.mockResolvedValue(mockSuggestions);

    const { result, waitForNextUpdate } = renderHook(() => 
      useFeatureSuggestions({ suggestionService: mockSuggestionService })
    );

    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.error).toBeNull();

    await waitForNextUpdate();

    // After loading
    expect(result.current.loading).toBe(false);
    expect(result.current.suggestions).toEqual(mockSuggestions);
    expect(result.current.error).toBeNull();
    expect(mockSuggestionService.getPopularSuggestions).toHaveBeenCalledTimes(1);
  });

  it('should handle errors when loading suggestions', async () => {
    const error = new Error('Failed to load suggestions');
    mockSuggestionService.getPopularSuggestions.mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() => 
      useFeatureSuggestions({ suggestionService: mockSuggestionService })
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(error);
  });

  it('should submit a suggestion', async () => {
    const newSuggestion = {
      id: '2',
      title: 'New Suggestion',
      description: 'New Description',
      submittedBy: 'user1',
      submittedAt: new Date(),
      status: SuggestionStatus.PENDING,
      priority: SuggestionPriority.HIGH,
      votes: 0,
      tags: ['new'],
      relatedTodoIds: [],
      updatedAt: new Date()
    };

    mockSuggestionService.submitSuggestion.mockResolvedValue(newSuggestion);
    mockSuggestionService.getPopularSuggestions.mockResolvedValue([newSuggestion]);

    const { result, waitForNextUpdate } = renderHook(() => 
      useFeatureSuggestions({ suggestionService: mockSuggestionService })
    );

    await waitForNextUpdate();

    await act(async () => {
      await result.current.submitSuggestion(
        'New Suggestion',
        'New Description',
        'user1',
        SuggestionPriority.HIGH,
        ['new']
      );
    });

    expect(mockSuggestionService.submitSuggestion).toHaveBeenCalledWith({
      title: 'New Suggestion',
      description: 'New Description',
      submittedBy: 'user1',
      priority: SuggestionPriority.HIGH,
      tags: ['new'],
      status: SuggestionStatus.PENDING
    });
    expect(mockSuggestionService.getPopularSuggestions).toHaveBeenCalledTimes(2);
  });
});
