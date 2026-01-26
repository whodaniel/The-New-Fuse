import axios from 'axios';
import {
  Resource,
  ClaudeSkill,
  N8NWorkflow,
  AgentTemplate,
  ResourceFilter,
  ResourceStats,
  FavoriteResource,
  ResourceShare,
} from '../types/resources';

const API_BASE = import.meta.env.VITE_API_URL || '/api';


class ResourcesService {
  // Fetch all resources
  async getAllResources(): Promise<Resource[]> {
    const response = await axios.get(`${API_BASE}/resources`);
    return response.data;
  }

  // Fetch skills
  async getSkills(): Promise<ClaudeSkill[]> {
    const response = await axios.get(`${API_BASE}/resources/skills`);
    return response.data;
  }

  // Fetch workflows
  async getWorkflows(): Promise<N8NWorkflow[]> {
    const response = await axios.get(`${API_BASE}/resources/workflows`);
    return response.data;
  }

  // Fetch templates
  async getTemplates(): Promise<AgentTemplate[]> {
    const response = await axios.get(`${API_BASE}/resources/templates`);
    return response.data;
  }

  // Search resources
  async searchResources(filter: Partial<ResourceFilter>): Promise<Resource[]> {
    const response = await axios.post(`${API_BASE}/resources/search`, filter);
    return response.data;
  }

  // Get resource stats
  async getStats(): Promise<ResourceStats> {
    const response = await axios.get(`${API_BASE}/resources/stats`);
    return response.data;
  }

  // Toggle favorite
  async toggleFavorite(resourceId: string, userId: string): Promise<void> {
    await axios.post(`${API_BASE}/resources/${resourceId}/favorite`, { userId });
  }

  // Share resource with agent
  async shareResource(share: Omit<ResourceShare, 'sharedAt'>): Promise<void> {
    await axios.post(`${API_BASE}/resources/share`, share);
  }

  // Execute/Install skill
  async executeSkill(skillId: string): Promise<any> {
    const response = await axios.post(`${API_BASE}/skills/${skillId}/execute`);
    return response.data;
  }

  // Import workflow
  async importWorkflow(workflowId: string): Promise<any> {
    const response = await axios.post(`${API_BASE}/workflows/${workflowId}/import`);
    return response.data;
  }

  // Create agent from template
  async createAgentFromTemplate(templateId: string, customConfig?: any): Promise<any> {
    const response = await axios.post(`${API_BASE}/templates/${templateId}/create-agent`, customConfig);
    return response.data;
  }
}

export const resourcesService = new ResourcesService();
export default resourcesService;
