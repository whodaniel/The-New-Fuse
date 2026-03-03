import axios from 'axios';
import {
  AgentTemplate,
  ClaudeSkill,
  N8NWorkflow,
  Resource,
  ResourceFilter,
  ResourceShare,
  ResourceStats,
} from '../types/resources';
import { marketplaceService, type MarketplaceCatalogItem } from './marketplace.service';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ResourcesService {
  private mapCategory(category: string): Resource['category'] {
    const value = (category || '').toLowerCase();
    if (['development', 'developer-tools', 'code'].includes(value)) return 'development';
    if (['productivity', 'ops'].includes(value)) return 'productivity';
    if (['communication', 'social', 'chat'].includes(value)) return 'communication';
    if (['data', 'analytics'].includes(value)) return 'data';
    if (['automation', 'workflow'].includes(value)) return 'automation';
    if (['ai', 'model'].includes(value)) return 'ai';
    return 'other';
  }

  private toBaseResource(item: MarketplaceCatalogItem, type: Resource['type']): Resource {
    const reviews = Math.max(0, Math.floor(item.totalRuns * 0.02));
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      type,
      category: this.mapCategory(item.category),
      tags: item.tags || [],
      author: item.createdBy || 'marketplace',
      version: '1.0.0',
      downloads: item.totalRuns || 0,
      rating: item.rating || 0,
      reviews,
      featured: item.rating >= 4.7 && item.publicationStatus === 'published',
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
      icon: item.avatarUrl,
      previewImage: item.avatarUrl,
    };
  }

  private toSkill(item: MarketplaceCatalogItem): ClaudeSkill {
    const base = this.toBaseResource(item, 'skill');
    const skillType: ClaudeSkill['skillType'] =
      item.kind === 'prompt'
        ? 'prompt'
        : item.kind === 'mcp_server' || item.kind === 'model'
          ? 'integration'
          : 'mcp-tool';

    return {
      ...base,
      type: 'skill',
      skillType,
      capabilities: item.capabilities || [],
      modelCompatibility: ['gpt-4.1', 'o3', 'claude-3.7'],
      examples: [
        {
          title: `Use ${item.name}`,
          description: 'Run this resource from the marketplace surface.',
          input: `activate ${item.slug}`,
          output: 'resource activated',
        },
      ],
      documentation: item.launchUrl || `${API_BASE}/marketplace/catalog/${item.id}`,
      sourceUrl: item.launchUrl,
      installCommand: `tnf marketplace install ${item.slug}`,
    };
  }

  private toWorkflow(item: MarketplaceCatalogItem): N8NWorkflow {
    const base = this.toBaseResource(item, 'workflow');
    const capabilityCount = item.capabilities?.length || 0;
    const complexity: N8NWorkflow['complexity'] =
      capabilityCount >= 6 ? 'complex' : capabilityCount >= 3 ? 'medium' : 'simple';
    const triggers = item.tags?.length ? item.tags.slice(0, 3) : ['manual'];
    const actions = item.capabilities?.length ? item.capabilities.slice(0, 5) : ['run'];

    return {
      ...base,
      type: 'workflow',
      nodes: Math.max(3, capabilityCount * 2 || 3),
      triggers,
      actions,
      integrations:
        item.tags?.filter((tag) => ['mcp', 'slack', 'github', 'notion'].includes(tag)) || [],
      complexity,
      workflowData: { marketplaceId: item.id, slug: item.slug },
      importUrl: item.launchUrl || `${API_BASE}/marketplace/catalog/${item.id}`,
    };
  }

  private toTemplate(item: MarketplaceCatalogItem): AgentTemplate {
    const base = this.toBaseResource(item, 'template');
    const tagSet = new Set((item.tags || []).map((tag) => tag.toLowerCase()));
    const templateType: AgentTemplate['templateType'] = tagSet.has('analysis')
      ? 'analysis'
      : tagSet.has('automation')
        ? 'automation'
        : tagSet.has('task')
          ? 'task'
          : 'chat';

    return {
      ...base,
      type: 'template',
      templateType,
      model: 'gpt-4.1',
      systemPrompt: `You are ${item.name}. ${item.description}`,
      capabilities: item.capabilities || [],
      configuration: {
        marketplaceId: item.id,
        slug: item.slug,
      },
      requiredSkills: item.tags?.slice(0, 3) || [],
      optionalSkills: item.tags?.slice(3, 6) || [],
    };
  }

  private async getMarketplaceItems(): Promise<MarketplaceCatalogItem[]> {
    try {
      const catalog = await marketplaceService.getCatalog({ status: 'published' });
      return Array.isArray(catalog.items) ? catalog.items : [];
    } catch {
      return [];
    }
  }

  private async getLegacyArray<T>(path: string): Promise<T[]> {
    try {
      const response = await axios.get(`${API_BASE}${path}`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data as T[];
      }
      return [];
    } catch {
      return [];
    }
  }

  private filterAndSortResources(
    resources: Resource[],
    filter: Partial<ResourceFilter>
  ): Resource[] {
    let filtered = [...resources];

    if (filter.search) {
      const needle = filter.search.toLowerCase();
      filtered = filtered.filter((item) => {
        const haystack = [item.name, item.description, ...item.tags].join(' ').toLowerCase();
        return haystack.includes(needle);
      });
    }

    if (filter.type && filter.type !== 'all') {
      filtered = filtered.filter((item) => item.type === filter.type);
    }

    if (filter.category && filter.category !== 'all') {
      filtered = filtered.filter((item) => item.category === filter.category);
    }

    if (filter.tags?.length) {
      const selected = new Set(filter.tags.map((tag) => tag.toLowerCase()));
      filtered = filtered.filter((item) =>
        item.tags.some((tag) => selected.has(tag.toLowerCase()))
      );
    }

    if (filter.featured) {
      filtered = filtered.filter((item) => item.featured);
    }

    const sortBy = filter.sortBy || 'popular';
    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'recent')
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return b.downloads - a.downloads;
    });

    return filtered;
  }

  private buildStats(resources: Resource[]): ResourceStats {
    const totalResources = resources.length;
    const totalSkills = resources.filter((item) => item.type === 'skill').length;
    const totalWorkflows = resources.filter((item) => item.type === 'workflow').length;
    const totalTemplates = resources.filter((item) => item.type === 'template').length;
    const totalDownloads = resources.reduce((sum, item) => sum + (item.downloads || 0), 0);
    const averageRating =
      totalResources > 0
        ? Number(
            (resources.reduce((sum, item) => sum + (item.rating || 0), 0) / totalResources).toFixed(
              2
            )
          )
        : 0;

    return {
      totalResources,
      totalSkills,
      totalWorkflows,
      totalTemplates,
      totalDownloads,
      averageRating,
    };
  }

  // Fetch all resources
  async getAllResources(): Promise<Resource[]> {
    const legacy = await this.getLegacyArray<Resource>('/resources');
    if (legacy.length > 0) {
      return legacy;
    }

    const marketplaceItems = await this.getMarketplaceItems();
    const skills = marketplaceItems
      .filter((item) => ['skill', 'prompt', 'mcp_server', 'model'].includes(item.kind))
      .map((item) => this.toSkill(item));
    const workflows = marketplaceItems
      .filter((item) => item.kind === 'workflow')
      .map((item) => this.toWorkflow(item));
    const templates = marketplaceItems
      .filter((item) => item.kind === 'agent_template')
      .map((item) => this.toTemplate(item));

    return [...skills, ...workflows, ...templates];
  }

  // Fetch skills
  async getSkills(): Promise<ClaudeSkill[]> {
    const legacy = await this.getLegacyArray<ClaudeSkill>('/resources/skills');
    if (legacy.length > 0) {
      return legacy;
    }

    const marketplaceItems = await this.getMarketplaceItems();
    return marketplaceItems
      .filter((item) => ['skill', 'prompt', 'mcp_server', 'model'].includes(item.kind))
      .map((item) => this.toSkill(item));
  }

  // Fetch workflows
  async getWorkflows(): Promise<N8NWorkflow[]> {
    const legacy = await this.getLegacyArray<N8NWorkflow>('/resources/workflows');
    if (legacy.length > 0) {
      return legacy;
    }

    const marketplaceItems = await this.getMarketplaceItems();
    return marketplaceItems
      .filter((item) => item.kind === 'workflow')
      .map((item) => this.toWorkflow(item));
  }

  // Fetch templates
  async getTemplates(): Promise<AgentTemplate[]> {
    const legacy = await this.getLegacyArray<AgentTemplate>('/resources/templates');
    if (legacy.length > 0) {
      return legacy;
    }

    const marketplaceItems = await this.getMarketplaceItems();
    return marketplaceItems
      .filter((item) => item.kind === 'agent_template')
      .map((item) => this.toTemplate(item));
  }

  // Search resources
  async searchResources(filter: Partial<ResourceFilter>): Promise<Resource[]> {
    try {
      const response = await axios.post(`${API_BASE}/resources/search`, filter);
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch {
      // Fallback to marketplace-backed local filtering.
    }

    const resources = await this.getAllResources();
    return this.filterAndSortResources(resources, filter);
  }

  // Get resource stats
  async getStats(): Promise<ResourceStats> {
    try {
      const response = await axios.get(`${API_BASE}/resources/stats`);
      const data = response.data as Partial<ResourceStats> & { totalViews?: number };
      if ((data.totalResources || 0) > 0) {
        return {
          totalResources: data.totalResources || 0,
          totalSkills: data.totalSkills || 0,
          totalWorkflows: data.totalWorkflows || 0,
          totalTemplates: data.totalTemplates || 0,
          totalDownloads: data.totalDownloads || 0,
          averageRating: data.averageRating || 0,
        };
      }
    } catch {
      // Fallback to marketplace-derived stats.
    }

    const resources = await this.getAllResources();
    return this.buildStats(resources);
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
    try {
      const response = await axios.post(`${API_BASE}/skills/${skillId}/execute`);
      return response.data;
    } catch (error) {
      throw new Error(
        `Skill execution unavailable for ${skillId}: ${
          error instanceof Error ? error.message : 'request failed'
        }`
      );
    }
  }

  // Import workflow
  async importWorkflow(workflowId: string): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE}/workflows/${workflowId}/import`);
      return response.data;
    } catch (error) {
      throw new Error(
        `Workflow import unavailable for ${workflowId}: ${
          error instanceof Error ? error.message : 'request failed'
        }`
      );
    }
  }

  // Create agent from template
  async createAgentFromTemplate(templateId: string, customConfig?: any): Promise<any> {
    try {
      const response = await axios.post(
        `${API_BASE}/templates/${templateId}/create-agent`,
        customConfig
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Agent creation from template unavailable for ${templateId}: ${
          error instanceof Error ? error.message : 'request failed'
        }`
      );
    }
  }
}

export const resourcesService = new ResourcesService();
export default resourcesService;
