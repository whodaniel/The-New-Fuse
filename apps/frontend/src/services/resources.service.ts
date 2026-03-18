import axios from 'axios';
import {
  AgentTemplate,
  ClaudeSkill,
  N8NWorkflow,
  Resource,
  ResourceFilter,
  ResourceSearchEnvelope,
  ResourceSearchProtocolRequestEnvelope,
  ResourceSearchProtocolResponseEnvelope,
  ResourceSearchResult,
  ResourceShare,
  ResourceStats,
  ResourceTraitScreenMeta,
} from '../types/resources';
import { marketplaceService, type MarketplaceCatalogItem } from './marketplace.service';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const SEARCH_CACHE_TTL_MS = 60_000;
const SEARCH_CACHE_MAX_ENTRIES = 100;

type CachedSearchEntry = {
  items: Resource[];
  traitScreen: ResourceTraitScreenMeta | null;
  expiresAt: number;
};

export class ResourcesService {
  // Backward-compatibility field for callers that still read last trait metadata.
  private lastTraitSearchMeta: ResourceTraitScreenMeta | null = null;
  private searchCache = new Map<string, CachedSearchEntry>();

  private buildProtocolRequestEnvelope(
    filter: Partial<ResourceFilter>,
    envelope: Partial<ResourceSearchProtocolRequestEnvelope> = {}
  ): ResourceSearchProtocolRequestEnvelope {
    const messageId = this.createMessageId();
    const sentAt = new Date().toISOString();
    const payload = {
      ...filter,
      includeTraitMeta: filter.includeTraitMeta ?? true,
    };

    return {
      id: envelope.id || messageId,
      spec: envelope.spec || 'sgp/0.1',
      type: 'RESOURCE.SEARCH.REQUEST',
      tenant: envelope.tenant || 'default',
      resource: envelope.resource || 'sgp://default/resources/search',
      sent_at: envelope.sent_at || sentAt,
      actor: envelope.actor,
      trace: envelope.trace || {
        correlation_id: messageId,
        causation_id: null,
      },
      payload,
    };
  }

  private createMessageId(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }

    return `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token =
      window.localStorage.getItem('auth_token') ||
      window.localStorage.getItem('authToken') ||
      window.localStorage.getItem('token');

    return token ? { Authorization: `Bearer ${token}` } : {};
  }

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

  private asObject(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  private asStringArray(value: unknown): string[] {
    return Array.isArray(value)
      ? value.filter((entry): entry is string => typeof entry === 'string')
      : [];
  }

  private parseTraitMeta(value: unknown): ResourceTraitScreenMeta | null {
    const input = this.asObject(value);
    if (!input) {
      return null;
    }

    const confidenceValue = input.confidence;
    const confidence =
      confidenceValue === 'high' || confidenceValue === 'medium' || confidenceValue === 'low'
        ? confidenceValue
        : null;

    return {
      enabled: Boolean(input.enabled),
      used: Boolean(input.used),
      confidence,
      traitFilters: this.asStringArray(input.traitFilters),
      requiredAgentIds: this.asStringArray(input.requiredAgentIds),
      fallbackToBroadSearch: Boolean(input.fallbackToBroadSearch),
      beforeTraitCount: Number(input.beforeTraitCount || 0),
      afterTraitCount: Number(input.afterTraitCount || 0),
    };
  }

  private parseSearchResponse(data: unknown): ResourceSearchResult | null {
    if (Array.isArray(data)) {
      return { items: data as Resource[], traitScreen: null };
    }

    const envelope = this.asObject(data) as ResourceSearchEnvelope | null;
    if (!envelope || !Array.isArray(envelope.items)) {
      return null;
    }

    return {
      items: envelope.items,
      traitScreen: this.parseTraitMeta(envelope.traitScreen),
    };
  }

  private buildSearchCacheKey(filter: Partial<ResourceFilter>): string {
    const tags = Array.isArray(filter.tags) ? [...filter.tags].sort() : [];
    const normalized = {
      search: (filter.search || '').trim().toLowerCase(),
      type: filter.type || 'all',
      category: filter.category || 'all',
      tags,
      featured: Boolean(filter.featured),
      sortBy: filter.sortBy || 'popular',
      traitScreen: filter.traitScreen ?? true,
      traitLimit: filter.traitLimit ?? null,
      traitThreshold: filter.traitThreshold ?? null,
      includeTraitMeta: filter.includeTraitMeta ?? true,
    };
    return JSON.stringify(normalized);
  }

  private getCachedSearch(key: string): CachedSearchEntry | null {
    const entry = this.searchCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.searchCache.delete(key);
      return null;
    }
    return entry;
  }

  private setCachedSearch(key: string, entry: Omit<CachedSearchEntry, 'expiresAt'>): void {
    const record: CachedSearchEntry = {
      ...entry,
      expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
    };
    this.searchCache.set(key, record);

    if (this.searchCache.size <= SEARCH_CACHE_MAX_ENTRIES) return;

    // Opportunistically delete expired entries first, then oldest remainder.
    for (const [cacheKey, cacheValue] of this.searchCache.entries()) {
      if (cacheValue.expiresAt <= Date.now()) {
        this.searchCache.delete(cacheKey);
      }
    }
    while (this.searchCache.size > SEARCH_CACHE_MAX_ENTRIES) {
      const firstKey = this.searchCache.keys().next().value;
      if (!firstKey) break;
      this.searchCache.delete(firstKey);
    }
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

  // Search resources and return items + trait metadata together.
  async searchResourcesWithMeta(filter: Partial<ResourceFilter>): Promise<ResourceSearchResult> {
    this.lastTraitSearchMeta = null;
    const cacheKey = this.buildSearchCacheKey(filter);
    const cached = this.getCachedSearch(cacheKey);
    if (cached) {
      this.lastTraitSearchMeta = cached.traitScreen;
      return {
        items: cached.items,
        traitScreen: cached.traitScreen,
      };
    }

    try {
      const response = await axios.post(`${API_BASE}/resources/search`, {
        ...filter,
        includeTraitMeta: filter.includeTraitMeta ?? true,
      });

      const parsed = this.parseSearchResponse(response.data);
      if (parsed) {
        this.lastTraitSearchMeta = parsed.traitScreen;
        this.setCachedSearch(cacheKey, {
          items: parsed.items,
          traitScreen: parsed.traitScreen,
        });
        return parsed;
      }
    } catch {
      // Fallback to marketplace-backed local filtering.
    }

    const resources = await this.getAllResources();
    const fallbackItems = this.filterAndSortResources(resources, filter);
    this.setCachedSearch(cacheKey, {
      items: fallbackItems,
      traitScreen: null,
    });
    this.lastTraitSearchMeta = null;
    return {
      items: fallbackItems,
      traitScreen: null,
    };
  }

  // Backward-compatible resources-only search result.
  async searchResources(filter: Partial<ResourceFilter>): Promise<Resource[]> {
    const result = await this.searchResourcesWithMeta(filter);
    return result.items;
  }

  async searchResourcesProtocol(
    filter: Partial<ResourceFilter>,
    envelope: Partial<ResourceSearchProtocolRequestEnvelope> = {}
  ): Promise<ResourceSearchProtocolResponseEnvelope> {
    const requestEnvelope = this.buildProtocolRequestEnvelope(filter, envelope);
    const response = await axios.post(`${API_BASE}/resources/search/protocol`, requestEnvelope);
    const responseEnvelope = response.data as ResourceSearchProtocolResponseEnvelope;
    const parsedPayload = this.parseSearchResponse(responseEnvelope?.payload);
    this.lastTraitSearchMeta = parsedPayload?.traitScreen || null;
    return responseEnvelope;
  }

  getLastTraitSearchMeta(): ResourceTraitScreenMeta | null {
    return this.lastTraitSearchMeta;
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
  async toggleFavorite(
    resourceId: string,
    userId?: string
  ): Promise<{ success: boolean; resourceId: string; userId: string; favorite: boolean }> {
    const response = await axios.post(
      `${API_BASE}/resources/${resourceId}/favorite`,
      userId ? { userId } : {},
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data as {
      success: boolean;
      resourceId: string;
      userId: string;
      favorite: boolean;
    };
  }

  // Share resource with agent
  async shareResource(
    share: Omit<ResourceShare, 'sharedAt'>
  ): Promise<{ success: boolean; share: ResourceShare & { id: string } }> {
    const response = await axios.post(`${API_BASE}/resources/share`, share, {
      headers: this.getAuthHeaders(),
    });
    return response.data as { success: boolean; share: ResourceShare & { id: string } };
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
