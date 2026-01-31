/**
 * Unified Search Service
 *
 * Aggregates search results from multiple sources:
 * - TNF internal marketplace (PostgreSQL)
 * - MCP-DRS discovery service (Elasticsearch)
 *
 * Provides a single, consistent search interface for all asset types.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  AssetType,
  MarketplaceAsset,
  MarketplaceSearchParams,
  MarketplaceSearchResult,
  SearchFacets,
} from '../types/unified-asset';
import { MCPDRSClient, mcpDrsClient } from './mcp-drs-client';

interface SearchSource {
  name: string;
  search: (params: MarketplaceSearchParams) => Promise<MarketplaceAsset[]>;
  getTotal: (params: MarketplaceSearchParams) => Promise<number>;
  supportedTypes: AssetType[];
}

@Injectable()
export class UnifiedSearchService {
  private readonly logger = new Logger(UnifiedSearchService.name);
  private sources: SearchSource[] = [];

  constructor(private readonly mcpClient: MCPDRSClient = mcpDrsClient) {
    this.registerSources();
  }

  /**
   * Register all search sources
   */
  private registerSources(): void {
    // MCP-DRS source for MCP servers
    this.sources.push({
      name: 'mcp-drs',
      supportedTypes: ['MCP_SERVER'],
      search: async (params) => {
        try {
          const response = await this.mcpClient.searchServers(params);
          return response.servers.map((s) => this.mcpClient.mapToMarketplaceAsset(s));
        } catch (error) {
          this.logger.error(`MCP-DRS search failed: ${error}`);
          return [];
        }
      },
      getTotal: async (params) => {
        try {
          const response = await this.mcpClient.searchServers({ ...params, limit: 0 });
          return response.total;
        } catch {
          return 0;
        }
      },
    });

    // TODO: Add TNF internal source for skills, prompts, agents
    // this.sources.push({
    //   name: 'tnf-internal',
    //   supportedTypes: ['SKILL', 'PROMPT', 'PROMPT_PACK', 'AGENT'],
    //   search: async (params) => { ... },
    //   getTotal: async (params) => { ... },
    // });
  }

  /**
   * Unified search across all sources
   */
  async search(params: MarketplaceSearchParams): Promise<MarketplaceSearchResult> {
    const startTime = Date.now();

    // Determine which sources to query based on type filter
    const relevantSources = this.getRelevantSources(params.type);

    // Execute searches in parallel
    const searchPromises = relevantSources.map(async (source) => {
      const sourceParams = this.adjustParamsForSource(params, source);
      return source.search(sourceParams);
    });

    const results = await Promise.all(searchPromises);

    // Merge and deduplicate results
    let allAssets = this.mergeResults(results);

    // Apply unified filtering
    allAssets = this.applyFilters(allAssets, params);

    // Apply unified sorting
    allAssets = this.applySort(allAssets, params.sort, params.order);

    // Calculate facets
    const facets = this.calculateFacets(allAssets);

    // Apply pagination
    const total = allAssets.length;
    const offset = params.offset || 0;
    const limit = params.limit || 20;
    const paginatedAssets = allAssets.slice(offset, offset + limit);

    return {
      total,
      assets: paginatedAssets,
      facets,
      took: Date.now() - startTime,
    };
  }

  /**
   * Get a single asset by ID
   */
  async getAsset(assetId: string): Promise<MarketplaceAsset | null> {
    // Determine source from ID prefix
    if (assetId.startsWith('mcp-')) {
      const externalId = assetId.replace('mcp-', '');
      try {
        const server = await this.mcpClient.getServer(externalId);
        return this.mcpClient.mapToMarketplaceAsset(server);
      } catch {
        return null;
      }
    }

    // TODO: Query TNF internal sources
    return null;
  }

  /**
   * Get featured assets
   */
  async getFeatured(limit = 10): Promise<MarketplaceAsset[]> {
    const result = await this.search({
      featured: true,
      sort: 'popular',
      limit,
    });
    return result.assets;
  }

  /**
   * Get trending assets (most downloads in last 7 days)
   */
  async getTrending(limit = 10): Promise<MarketplaceAsset[]> {
    const result = await this.search({
      sort: 'downloads',
      order: 'desc',
      limit,
    });
    return result.assets;
  }

  /**
   * Get assets by category
   */
  async getByCategory(category: string, limit = 20): Promise<MarketplaceAsset[]> {
    const result = await this.search({
      category: [category],
      sort: 'popular',
      limit,
    });
    return result.assets;
  }

  /**
   * Get assets by author
   */
  async getByAuthor(authorId: string, limit = 50): Promise<MarketplaceAsset[]> {
    const result = await this.search({
      author: authorId,
      sort: 'recent',
      limit,
    });
    return result.assets;
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private getRelevantSources(types?: AssetType[]): SearchSource[] {
    if (!types || types.length === 0) {
      return this.sources;
    }

    return this.sources.filter((source) => source.supportedTypes.some((t) => types.includes(t)));
  }

  private adjustParamsForSource(
    params: MarketplaceSearchParams,
    source: SearchSource
  ): MarketplaceSearchParams {
    // Filter types to only those supported by this source
    const types = params.type?.filter((t) => source.supportedTypes.includes(t));

    return {
      ...params,
      type: types && types.length > 0 ? types : undefined,
      // Fetch more than needed for merging, then paginate later
      limit: (params.limit || 20) * 2,
      offset: 0,
    };
  }

  private mergeResults(results: MarketplaceAsset[][]): MarketplaceAsset[] {
    const merged: MarketplaceAsset[] = [];
    const seen = new Set<string>();

    for (const resultSet of results) {
      for (const asset of resultSet) {
        // Deduplicate by ID
        if (!seen.has(asset.id)) {
          seen.add(asset.id);
          merged.push(asset);
        }
      }
    }

    return merged;
  }

  private applyFilters(
    assets: MarketplaceAsset[],
    params: MarketplaceSearchParams
  ): MarketplaceAsset[] {
    let filtered = assets;

    // Type filter
    if (params.type && params.type.length > 0) {
      filtered = filtered.filter((a) => params.type!.includes(a.type));
    }

    // Category filter
    if (params.category && params.category.length > 0) {
      filtered = filtered.filter((a) => params.category!.includes(a.category));
    }

    // Tags filter
    if (params.tags && params.tags.length > 0) {
      filtered = filtered.filter((a) => params.tags!.some((tag) => a.tags.includes(tag)));
    }

    // Rating filter
    if (params.minRating !== undefined) {
      filtered = filtered.filter((a) => a.communityRating >= params.minRating!);
    }

    // Trust score filter
    if (params.minTrust !== undefined) {
      filtered = filtered.filter((a) => a.trustScore >= params.minTrust!);
    }

    // Pricing filter
    if (params.pricing && params.pricing.length > 0) {
      filtered = filtered.filter((a) => params.pricing!.includes(a.pricing.type));
    }

    // Verified filter
    if (params.verified !== undefined) {
      filtered = filtered.filter((a) => a.isVerified === params.verified);
    }

    // Featured filter
    if (params.featured !== undefined) {
      filtered = filtered.filter((a) => a.isFeatured === params.featured);
    }

    // Platform filter
    if (params.platforms && params.platforms.length > 0) {
      filtered = filtered.filter((a) =>
        params.platforms!.some((p) => a.compatibility.platforms.includes(p))
      );
    }

    // Text search (if not already handled by source)
    if (params.q) {
      const query = params.q.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.tags.some((t) => t.toLowerCase().includes(query)) ||
          a.capabilities.some((c) => c.toLowerCase().includes(query))
      );
    }

    return filtered;
  }

  private applySort(
    assets: MarketplaceAsset[],
    sort?: MarketplaceSearchParams['sort'],
    order?: 'asc' | 'desc'
  ): MarketplaceAsset[] {
    const sortOrder = order === 'asc' ? 1 : -1;

    return [...assets].sort((a, b) => {
      switch (sort) {
        case 'popular':
          return (b.downloadCount - a.downloadCount) * sortOrder;
        case 'recent':
          return (b.createdAt.getTime() - a.createdAt.getTime()) * sortOrder;
        case 'rating':
          return (b.communityRating - a.communityRating) * sortOrder;
        case 'price':
          const priceA = a.pricing.price || 0;
          const priceB = b.pricing.price || 0;
          return (priceA - priceB) * sortOrder;
        case 'downloads':
          return (b.downloadCount - a.downloadCount) * sortOrder;
        default:
          // Default: sort by trust score then popularity
          if (b.trustScore !== a.trustScore) {
            return (b.trustScore - a.trustScore) * sortOrder;
          }
          return (b.downloadCount - a.downloadCount) * sortOrder;
      }
    });
  }

  private calculateFacets(assets: MarketplaceAsset[]): SearchFacets {
    const facets: SearchFacets = {
      types: {} as Record<AssetType, number>,
      categories: {},
      pricing: {} as Record<string, number>,
      platforms: {} as Record<string, number>,
      tags: {},
    };

    for (const asset of assets) {
      // Type facet
      facets.types[asset.type] = (facets.types[asset.type] || 0) + 1;

      // Category facet
      facets.categories[asset.category] = (facets.categories[asset.category] || 0) + 1;

      // Pricing facet
      facets.pricing[asset.pricing.type] = (facets.pricing[asset.pricing.type] || 0) + 1;

      // Platform facets
      for (const platform of asset.compatibility.platforms) {
        facets.platforms[platform] = (facets.platforms[platform] || 0) + 1;
      }

      // Tag facets (top 20)
      for (const tag of asset.tags) {
        facets.tags[tag] = (facets.tags[tag] || 0) + 1;
      }
    }

    // Limit tags to top 20 by count
    const sortedTags = Object.entries(facets.tags)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);
    facets.tags = Object.fromEntries(sortedTags);

    return facets;
  }
}

// Export singleton for non-DI usage
export const unifiedSearchService = new UnifiedSearchService();
