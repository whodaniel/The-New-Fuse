import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { v4 as uuidv4 } from 'uuid';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  variables: Record<string, string>;
  testCases: any[];
  createdAt: string;
  updatedAt: string;
  versions?: PromptTemplateVersion[];
}

export interface PromptTemplateVersion {
  id: string;
  templateId: string;
  content: string;
  variables: Record<string, string>;
  testCases: any[];
  createdAt: string;
  createdBy: string;
  comment: string;
}

export interface SaveTemplateParams {
  id?: string;
  name: string;
  description: string;
  content: string;
  variables: Record<string, string>;
  testCases: any[];
  comment?: string;
}

export function usePromptTemplates(): any {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/prompt-templates');
      setTemplates(response.data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading prompt templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (params: SaveTemplateParams) => {
    setLoading(true);
    try {
      let response;
      if (params.id) {
        // Update existing template
        response = await api.put(`/api/prompt-templates/${params.id}`, params);
      } else {
        // Create new template
        response = await api.post('/api/prompt-templates', {
          ...params,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      await loadTemplates();
      return response.data;
    } catch (err) {
      setError(err as Error);
      console.error('Error saving prompt template:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async (id: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/prompt-templates/${id}`);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err as Error);
      console.error(`Error loading prompt template ${id}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTemplateVersions = async (id: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/prompt-templates/${id}/versions`);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err as Error);
      console.error(`Error loading template versions for ${id}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    templates,
    loading,
    error,
    saveTemplate,
    loadTemplate,
    loadTemplates,
    getTemplateVersions
  };
}
