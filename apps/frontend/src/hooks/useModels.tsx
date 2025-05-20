import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

interface Model {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  maxTokens: number;
  contextWindow: number;
}

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
      const response = await api.get('/api/models');
      setModels(response.data);
      
      // Set default selected model if none is selected
      if (!selectedModel && response.data.length > 0) {
        setSelectedModel(response.data[0].id);
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
        temperature: 0.7
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
    generateCompletion
  };
}
