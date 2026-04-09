/**
 * useGeminiNano Hook
 *
 * React hook for using Chrome's built-in Gemini Nano AI
 * Provides easy access to on-device AI capabilities
 */

import { useCallback, useEffect, useState } from 'react';
import {
  geminiNano,
  GeminiNanoCapabilities,
  GeminiPromptOptions,
} from '../services/GeminiNanoService';

export interface UseGeminiNanoReturn {
  // State
  isAvailable: boolean;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  capabilities: GeminiNanoCapabilities | null;

  // Methods
  initialize: () => Promise<boolean>;
  prompt: (input: string, options?: GeminiPromptOptions) => Promise<string>;
  promptStreaming: (
    input: string,
    onChunk: (chunk: string) => void,
    options?: GeminiPromptOptions
  ) => Promise<void>;
  countTokens: (input: string) => Promise<number>;
  destroy: () => void;
}

export function useGeminiNano(): UseGeminiNanoReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<GeminiNanoCapabilities | null>(null);

  // Check capabilities on mount
  useEffect(() => {
    const checkCaps = async () => {
      try {
        const caps = await geminiNano.checkCapabilities();
        setCapabilities(caps);
        setIsAvailable(caps.available);
        setIsReady(geminiNano.isReady());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check capabilities');
      }
    };

    checkCaps();
  }, []);

  const initialize = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await geminiNano.initialize();
      setIsReady(success);
      return success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const prompt = useCallback(
    async (input: string, options?: GeminiPromptOptions): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await geminiNano.prompt(input, options);
        return response;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Prompt failed';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const promptStreaming = useCallback(
    async (
      input: string,
      onChunk: (chunk: string) => void,
      options?: GeminiPromptOptions
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        await geminiNano.promptStreaming(input, onChunk, options);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Streaming failed';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const countTokens = useCallback(async (input: string): Promise<number> => {
    try {
      return await geminiNano.countTokens(input);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Token counting failed';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const destroy = useCallback(() => {
    geminiNano.destroy();
    setIsReady(false);
  }, []);

  return {
    isAvailable,
    isReady,
    isLoading,
    error,
    capabilities,
    initialize,
    prompt,
    promptStreaming,
    countTokens,
    destroy,
  };
}
