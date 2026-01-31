/**
 * Unified AI Agent Assets Marketplace Gateway
 *
 * This package provides the federation layer between:
 * - MCP-DRS (MCP server discovery)
 * - TNF Marketplace (agents, skills, prompts)
 *
 * It offers a unified API for searching, browsing, and managing
 * all types of AI agent assets.
 */

// Types
export * from './types/unified-asset';

// Services
export { MCPDRSClient, mcpDrsClient } from './services/mcp-drs-client';
export { MarketplaceSyncService, marketplaceSyncService } from './services/sync.service';
export { UnifiedSearchService, unifiedSearchService } from './services/unified-search.service';

// Re-export common types for convenience
export type {
  AgentAsset,
  AssetType,
  AuthorInfo,
  MCPServerAsset,
  MarketplaceAsset,
  MarketplaceSearchParams,
  MarketplaceSearchResult,
  NFTInfo,
  PricingModel,
  PricingType,
  PromptAsset,
  PromptPackAsset,
  SearchFacets,
  SkillAsset,
} from './types/unified-asset';
