import { apiService } from './api';

export interface LLMProviderDTO {
  id: string;
  name: string;
  provider: string;
  modelName: string;
  isDefault?: boolean;
  isCustom?: boolean;
  apiEndpoint?: string;
}

export interface CreateLLMProviderDTO {
  name: string;
  provider: string;
  modelName: string;
  apiKey: string;
  apiEndpoint?: string;
}

export const LlmProviderService = {
  findAll: async (): Promise<LLMProviderDTO[]> => {
    return await apiService.get<LLMProviderDTO[]>('/api/llm/providers');
  },

  create: async (data: CreateLLMProviderDTO): Promise<LLMProviderDTO> => {
    return await apiService.post<LLMProviderDTO>('/api/llm/providers', data);
  },

  update: async (id: string, data: Partial<CreateLLMProviderDTO>): Promise<LLMProviderDTO> => {
    return await apiService.put<LLMProviderDTO>(`/api/llm/providers/${id}`, data);
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return await apiService.delete<{ success: boolean }>(`/api/llm/providers/${id}`);
  },

  setDefault: async (id: string): Promise<LLMProviderDTO> => {
    return await apiService.put<LLMProviderDTO>(`/api/llm/providers/${id}/default`, {});
  },
};
