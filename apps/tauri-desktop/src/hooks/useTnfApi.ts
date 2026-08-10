import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001';

interface QueryAgentParams {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  agent?: string;
  timeout?: number;
}

interface QueryResponse {
  message: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export const useTnfApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryAgent = useCallback(async (params: QueryAgentParams): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post<QueryResponse>(
        `${API_BASE_URL}/api/v1/chat/query`,
        {
          ...params,
          agentId: params.agent || 'tnf-agent',
          stream: false,
        },
        {
          timeout: params.timeout || 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.message;
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : 'Unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    queryAgent,
    isLoading,
    error,
  };
};