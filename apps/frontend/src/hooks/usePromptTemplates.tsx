import { useState, useEffect } from 'react';
import { api } from '../services/api';

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
  currentVersionId?: string;
  category?: string;
}

export interface PromptTemplateVersion {
  id: string;
  templateId: string;
  version: number;
  content: string;
  variables: Record<string, string>;
  testCases?: any[];
  createdAt: string;
  label?: string;
  changelog?: string;
}

export interface SaveTemplateParams {
  id?: string;
  name: string;
  description: string;
  content: string;
  variables: Record<string, string>;
  testCases: any[];
  category?: string;
  tags?: string[];
  changelog?: string;
}

export function usePromptTemplates(): any {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const transformBackendTemplate = (backendTemplate: any): PromptTemplate => {
    // Find the current version or the latest one
    let currentVersion = backendTemplate.versions?.find((v: any) => v.id === backendTemplate.currentVersionId);
    if (!currentVersion && backendTemplate.versions?.length > 0) {
      // Fallback to the latest version if currentVersionId is not set or not found
      currentVersion = backendTemplate.versions.sort((a: any, b: any) => b.version - a.version)[0];
    }

    return {
      id: backendTemplate.id,
      name: backendTemplate.name,
      description: backendTemplate.description || '',
      category: backendTemplate.category,
      content: currentVersion?.content || '',
      variables: currentVersion?.variables || {},
      testCases: [], // Test cases not yet persisted in backend version explicitly, defaulting to empty
      createdAt: backendTemplate.createdAt,
      updatedAt: backendTemplate.updatedAt,
      versions: backendTemplate.versions || [],
      currentVersionId: backendTemplate.currentVersionId
    };
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Assuming API service handles the base URL and '/prompt-templates' is the correct path relative to it
      // Use '/prompt-templates' matching the controller
      const response = await api.get('/prompt-templates');

      const mappedTemplates = Array.isArray(response.data)
        ? response.data.map(transformBackendTemplate)
        : [];

      setTemplates(mappedTemplates);
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
        // Update existing template (PUT)
        // We update the metadata
        await api.put(`/prompt-templates/${params.id}`, {
          name: params.name,
          description: params.description,
          category: params.category,
          tags: params.tags
        });

        // And create a new version for the content change
        response = await api.post(`/prompt-templates/${params.id}/versions`, {
          content: params.content,
          variables: params.variables,
          label: 'Updated via Workbench',
          changelog: params.changelog || 'Updated via Workbench'
        });
      } else {
        // Create new template (POST)
        // The backend expects specific structure for create with versions
        response = await api.post('/prompt-templates', {
          name: params.name,
          description: params.description,
          category: params.category || 'General',
          tags: params.tags || [],
          versions: [{
            content: params.content,
            variables: params.variables,
            version: 1,
            label: 'Initial Version'
          }]
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
      const response = await api.get(`/prompt-templates/${id}`);
      setError(null);
      return transformBackendTemplate(response.data);
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
      const response = await api.get(`/prompt-templates/${id}/versions`);
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
