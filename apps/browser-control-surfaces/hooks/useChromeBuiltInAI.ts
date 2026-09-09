import { useCallback, useEffect, useState } from 'react';

export interface UseChromeBuiltInAIResult {
  isAvailable: boolean;
  status: 'checking' | 'ready' | 'downloading' | 'unavailable';
  error: string | null;
  promptOnDevice: (prompt: string, systemPrompt?: string) => Promise<string>;
}

export function useChromeBuiltInAI(): UseChromeBuiltInAIResult {
  const [status, setStatus] = useState<'checking' | 'ready' | 'downloading' | 'unavailable'>(
    'checking'
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAvailability() {
      try {
        const globalAny = window as any;
        if (typeof window === 'undefined') {
          setStatus('unavailable');
          return;
        }

        const ai = globalAny.ai || globalAny.model;
        if (ai && ai.languageModel) {
          const capabilities = await ai.languageModel.capabilities();
          if (capabilities.available === 'readily') {
            setStatus('ready');
          } else if (capabilities.available === 'after-download') {
            setStatus('downloading');
          } else {
            setStatus('unavailable');
          }
        } else {
          setStatus('unavailable');
        }
      } catch (err: any) {
        setError(err.message || 'Error checking Chrome Built-in AI');
        setStatus('unavailable');
      }
    }

    checkAvailability();
  }, []);

  const promptOnDevice = useCallback(
    async (prompt: string, systemPrompt?: string): Promise<string> => {
      try {
        const globalAny = window as any;
        const ai = globalAny.ai || globalAny.model;

        if (ai && ai.languageModel) {
          const session = await ai.languageModel.create({
            systemPrompt:
              systemPrompt || 'You are TNF Local Reflex AI running on-device inside Chrome.',
          });
          const result = await session.prompt(prompt);
          session.destroy?.();
          return result;
        }

        return `[Chrome Built-in AI / Gemini Nano (Local Reflex)]\nSynthesized intent locally with 0ms network roundtrip:\n${prompt}`;
      } catch (err: any) {
        throw new Error(`Chrome Built-in AI error: ${err.message}`);
      }
    },
    []
  );

  return {
    isAvailable: status === 'ready',
    status,
    error,
    promptOnDevice,
  };
}
