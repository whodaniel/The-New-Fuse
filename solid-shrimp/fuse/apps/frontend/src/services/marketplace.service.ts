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
