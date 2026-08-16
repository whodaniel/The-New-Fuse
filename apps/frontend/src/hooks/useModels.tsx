// @ts-nocheck
import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface Model {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  maxTokens: number;
  contextWindow: number;
}

/**
 * useModels — fetch the canonical LLM catalog from the REST endpoint that
 * the api-gateway and tnf-cli populate from @the-new-fuse/llm-catalog.
 *
 * Primary endpoint: `/api/llm/models` (preferred — returns the same shape
 * as the catalog's `providers[].models[]`). Falls back to the legacy
 * `/api/models` for older surfaces.
 */
export function useModels(): any {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      // Try the canonical /api/llm/models endpoint first; fall back to
      // legacy /api/models if it isn't wired up in this environment.
      let data: Model[] = [];
      try {
        const resp = await api.get('/api/llm/models');
        // /api/llm/models returns { providers: [{ id, name, defaultModel, models: [{ id, name, provider }] }], defaultProvider }
        const flat: Model[] = [];
        for (const p of resp.data?.providers || []) {
          for (const m of p.models || []) {
            flat.push({
              id: m.id,
              name: m.name || m.id,
              provider: p.id,
              capabilities: [],
              maxTokens: 8192,
              contextWindow: 8192,
            });
          }
        }
        data = flat;
      } catch (_e1) {
        const resp = await api.get('/api/models');
        data = resp.data;
      }
      setModels(data);

      // Set default selected model if none is selected
      if (!selectedModel && data.length > 0) {
        setSelectedModel(data[0].id);
      }

      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading models:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCompletion = async (prompt: string) => {
    if (!selectedModel) {
      throw new Error('No model selected');
    }

    setLoading(true);
    try {
      const response = await api.post('/api/completions', {
        model: selectedModel,
        prompt,
        max_tokens: 1000,
        temperature: 0.7,
      });

      setError(null);
      return response.data.completion;
    } catch (err) {
      setError(err as Error);
      console.error('Error generating completion:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    models,
    selectedModel,
    setSelectedModel,
    loading,
    error,
    generateCompletion,
    refresh: loadModels,
  };
}
