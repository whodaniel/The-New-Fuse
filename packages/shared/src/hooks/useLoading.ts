/**
 * Loading State Hook
 * Simplifies loading state management for async operations
 */
import { useCallback, useState } from 'react';

/**
 * Simple loading state hook with loading wrapper function
 */
export function useLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T | undefined> => {
    setIsLoading(true);
    try {
      const result = await asyncFn();
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  return {
    isLoading,
    setIsLoading,
    withLoading,
    startLoading,
    stopLoading,
  };
}

/**
 * Async state interface
 */
export interface AsyncState<T> {
  isLoading: boolean;
  error: Error | null;
  data: T | null;
}

/**
 * Return type for useAsync hook
 */
export interface UseAsyncReturn<T, Args extends any[]> {
  isLoading: boolean;
  error: Error | null;
  data: T | null;
  execute: (...args: Args) => Promise<T | undefined>;
  reset: () => void;
}

/**
 * Advanced async hook with data and error state management
 */
export function useAsync<T, Args extends any[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  immediate = false
): UseAsyncReturn<T, Args> {
  const [state, setState] = useState<AsyncState<T>>({
    isLoading: immediate,
    error: null,
    data: null,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T | undefined> => {
      setState({ isLoading: true, error: null, data: null });

      try {
        const response = await asyncFunction(...args);
        setState({ isLoading: false, error: null, data: response });
        return response;
      } catch (error) {
        setState({ isLoading: false, error: error as Error, data: null });
        return undefined;
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, data: null });
  }, []);

  return {
    isLoading: state.isLoading,
    error: state.error,
    data: state.data,
    execute,
    reset,
  };
}
