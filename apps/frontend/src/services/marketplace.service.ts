import axios from 'axios';

export type MarketplaceKind =
  | 'experience'
  | 'workflow'
  | 'mcp_server'
  | 'skill'
  | 'prompt'
  | 'agent_template'
  | 'agent'
  | 'model';

export type MarketplacePublicationStatus = 'draft' | 'review' | 'published' | 'archived';

export interface MarketplaceCatalogItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  kind: MarketplaceKind;
  category: string;
  tags: string[];
  capabilities: string[];
  rating: number;
  totalRuns: number;
  successRate: number;
  pricePerRun: number;
  status: 'online' | 'busy' | 'offline';
  publicationStatus: MarketplacePublicationStatus;
  launchUrl?: string;
  avatarUrl?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceCatalogResponse {
  items: MarketplaceCatalogItem[];
  total: number;
}

export interface MarketplaceCatalogQuery {
  kind?: MarketplaceKind;
  status?: MarketplacePublicationStatus;
  category?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface MarketplaceResearchCountsResponse {
  available: boolean;
  counts: {
    categories: number;
    sources: number;
    sourceLinks: number;
    prompts: number;
    artifacts: number;
  };
  error?: string;
}

export interface MarketplaceResearchSourcesResponse {
  available: boolean;
  categories: Array<{
    id: number;
    name: string;
    sources: Array<{
      id: number;
      name: string;
      url: string;
      brief: string | null;
    }>;
  }>;
  error?: string;
}

export interface MarketplaceResearchSkillCountsResponse {
  available: boolean;
  counts: {
    categories: number;
    sources: number;
    sourceLinks: number;
    files: number;
  };
  error?: string;
}

export interface MarketplaceResearchSkillSourcesResponse {
  available: boolean;
  categories: Array<{
    id: number;
    name: string;
    sources: Array<{
      id: number;
      name: string;
      url: string;
      brief: string | null;
    }>;
  }>;
  error?: string;
}

export interface MarketplaceResearchSkillFile {
  id: number;
  sourceId: number;
  sourceName: string | null;
  categoryName: string | null;
  repoUrl: string | null;
  fileUrl: string;
  filePath: string | null;
  title: string | null;
  content: string;
  snippet: string;
  license: string | null;
  tags: string | null;
  createdAt: string | null;
}

export interface MarketplaceResearchSkillFilesResponse {
  available: boolean;
  items: MarketplaceResearchSkillFile[];
  total: number;
  error?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class MarketplaceService {
  async getCatalog(params?: MarketplaceCatalogQuery): Promise<MarketplaceCatalogResponse> {
    const response = await axios.get(`${API_BASE}/marketplace/catalog`, { params });
    return response.data;
  }

  async getExperiences(params?: {
    status?: MarketplacePublicationStatus;
  }): Promise<MarketplaceCatalogResponse> {
    const response = await axios.get(`${API_BASE}/marketplace/experiences`, { params });
    return response.data;
  }

  async getResearchCounts(): Promise<MarketplaceResearchCountsResponse> {
    const response = await axios.get(`${API_BASE}/marketplace/research/counts`);
    return response.data;
  }

  async getResearchSources(limitPerCategory = 8): Promise<MarketplaceResearchSourcesResponse> {
    const response = await axios.get(`${API_BASE}/marketplace/research/sources`, {
      params: { limitPerCategory },
    });
    return response.data;
  }

  async getResearchSkillCounts(): Promise<MarketplaceResearchSkillCountsResponse> {
    const response = await axios.get(`${API_BASE}/marketplace/research/skills/counts`);
    return response.data;
  }

  async getResearchSkillSources(
    limitPerCategory = 8
  ): Promise<MarketplaceResearchSkillSourcesResponse> {
    const response = await axios.get(`${API_BASE}/marketplace/research/skills/sources`, {
      params: { limitPerCategory },
    });
    return response.data;
  }

  async searchResearchSkillFiles(params?: {
    q?: string;
    sourceId?: number;
    limit?: number;
    offset?: number;
  }): Promise<MarketplaceResearchSkillFilesResponse> {
    const response = await axios.get(`${API_BASE}/marketplace/research/skills/files`, { params });
    return response.data;
  }

  async submitExperience(input: {
    name: string;
    description: string;
    category: string;
    launchUrl?: string;
    tags?: string[];
    createdBy?: string;
  }): Promise<MarketplaceCatalogItem> {
    const response = await axios.post(`${API_BASE}/marketplace/experiences/submit`, input);
    return response.data;
  }

  async submitCatalogItem(input: {
    name: string;
    description: string;
    kind: MarketplaceKind;
    category: string;
    launchUrl?: string;
    tags?: string[];
    capabilities?: string[];
    createdBy?: string;
  }): Promise<MarketplaceCatalogItem> {
    const response = await axios.post(`${API_BASE}/marketplace/catalog/submit`, input);
    return response.data;
  }

  async updatePublicationStatus(
    id: string,
    input: { toStatus: MarketplacePublicationStatus; moderatedBy?: string }
  ): Promise<MarketplaceCatalogItem> {
    const response = await axios.post(
      `${API_BASE}/marketplace/catalog/${id}/publication-status`,
      input
    );
    return response.data;
  }
}

export const marketplaceService = new MarketplaceService();
export default marketplaceService;
