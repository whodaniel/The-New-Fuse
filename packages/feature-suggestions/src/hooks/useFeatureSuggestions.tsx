import { useState, useCallback } from 'react';
import {
  FeatureSuggestion,
  SuggestionStatus,
  SuggestionPriority,
  TodoItem
} from '../types.js';
import { SuggestionService } from '../services/types.js';

/**
 * Props for the useFeatureSuggestions hook
 */
interface UseFeatureSuggestionsProps {
  /**
   * The suggestion service to use
   */
  suggestionService: SuggestionService;
}

/**
 * Return type for the useFeatureSuggestions hook
 */
interface UseFeatureSuggestionsReturn {
  suggestions: FeatureSuggestion[];
  loading: boolean;
  error: Error | null;
  submitSuggestion: (
    title: string,
    description: string,
    submittedBy: string,
    priority: SuggestionPriority,
    tags: string[]
  ) => Promise<FeatureSuggestion>;
  voteSuggestion: (suggestionId: string, userId: string) => Promise<void>;
  convertToFeature: (suggestionId: string) => Promise<FeatureSuggestion>;
  updateSuggestionStatus: (suggestionId: string, newStatus: SuggestionStatus) => Promise<void>;
  convertSuggestionToFeature: (suggestionId: string) => Promise<FeatureSuggestion>;
  addTodo: (
    title: string,
    description: string,
    priority: SuggestionPriority,
    suggestionId: string,
    assignedTo?: string,
    dueDate?: Date
  ) => Promise<TodoItem>;
  addComment: (suggestionId: string, content: string, authorId: string) => Promise<Comment>;
  refresh: () => Promise<void>;
}

export const useFeatureSuggestions = ({ suggestionService }: UseFeatureSuggestionsProps): UseFeatureSuggestionsReturn => {
  const [suggestions, setSuggestions] = useState<FeatureSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadSuggestions = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await suggestionService.getPopularSuggestions();
      setSuggestions(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load suggestions'));
    } finally {
      setLoading(false);
    }
  }, [suggestionService]);

  const submitSuggestion = useCallback(async (
    title: string,
    description: string,
    submittedBy: string,
    priority: SuggestionPriority,
    tags: string[]
  ): Promise<FeatureSuggestion> => {
    try {
      const newSuggestion = await suggestionService.submitSuggestion({
        title,
        description,
        submittedBy,
        priority,
        tags,
        status: SuggestionStatus.PENDING
      });
      await loadSuggestions();
      return newSuggestion;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit suggestion'));
      throw err;
    }
  }, [suggestionService, loadSuggestions]);

  const voteSuggestion = useCallback(async (
    suggestionId: string,
    userId: string
  ): Promise<void> => {
    try {
      await suggestionService.voteSuggestion(suggestionId, userId);
      await loadSuggestions();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to vote for suggestion'));
      throw err;
    }
  }, [suggestionService, loadSuggestions]);

  const convertToFeature = useCallback(async (suggestionId: string): Promise<FeatureSuggestion> => {
    try {
      const convertedSuggestion = await suggestionService.convertToFeature(suggestionId);
      await loadSuggestions();
      return convertedSuggestion;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to convert suggestion to feature'));
      throw err;
    }
  }, [suggestionService, loadSuggestions]);

  const updateSuggestionStatus = useCallback(async (
    suggestionId: string,
    newStatus: SuggestionStatus
  ): Promise<void> => {
    try {
      await suggestionService.updateSuggestionStatus(suggestionId, newStatus);
      await loadSuggestions();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update suggestion status'));
      throw err;
    }
  }, [suggestionService, loadSuggestions]);

  // Alias for convertToFeature to match what FeatureManagementView expects
  const convertSuggestionToFeature = convertToFeature;

  const addTodo = useCallback(async (
    title: string,
    description: string,
    priority: SuggestionPriority,
    suggestionId: string,
    assignedTo?: string,
    dueDate?: Date
  ): Promise<TodoItem> => {
    try {
      const newTodo = await suggestionService.addTodo({
        title,
        description,
        priority,
        suggestionId,
        assignedTo,
        dueDate
      });
      await loadSuggestions();
      return newTodo;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create todo'));
      throw err;
    }
  }, [suggestionService, loadSuggestions]);

  const addComment = useCallback(async (
    suggestionId: string,
    content: string,
    authorId: string
  ): Promise<Comment> => {
    try {
      const newComment = await suggestionService.addComment({
        suggestionId,
        content,
        authorId
      });
      await loadSuggestions();
      return newComment;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add comment'));
      throw err;
    }
  }, [suggestionService, loadSuggestions]);

  return {
    suggestions,
    loading,
    error,
    submitSuggestion,
    voteSuggestion,
    convertToFeature,
    updateSuggestionStatus,
    convertSuggestionToFeature,
    addTodo,
    addComment,
    refresh: loadSuggestions,
  };
};
