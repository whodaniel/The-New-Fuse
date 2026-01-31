/**
 * Unified AI Agent Assets Marketplace Types
 *
 * These types define the common interface for all marketplace assets
 * across MCP servers, skills, prompts, and agents.
 */

export type AssetType = 'MCP_SERVER' | 'SKILL' | 'PROMPT' | 'PROMPT_PACK' | 'AGENT';

export type PricingType = 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION' | 'PAY_PER_USE' | 'REVENUE_SHARE';

export type Currency = 'USD' | 'ETH' | 'MATIC' | 'FUSE';

export type SubscriptionPeriod = 'MONTHLY' | 'YEARLY';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'CERTIFIED' | 'PREMIUM';

export type Platform =
  | 'claude-desktop'
  | 'claude-code'
  | 'gemini-cli'
  | 'cursor'
  | 'vscode'
  | 'theia';

export type Chain = 'ethereum' | 'polygon' | 'tnf-chain';

export interface AuthorInfo {
  id: string;
  name: string;
  avatarUrl?: string;
  isVerified: boolean;
  reputation: number;
  assetCount: number;
  websiteUrl?: string;
  githubUrl?: string;
}

export interface PricingModel {
  type: PricingType;
  price?: number;
  currency: Currency;
  subscriptionPeriod?: SubscriptionPeriod;
  usageRate?: number;
  revenueSharePercent?: number;
  trialDays?: number;
}

export interface NFTInfo {
  tokenId: string;
  contractAddress: string;
  chain: Chain;
  isFractionalized: boolean;
  totalShares?: number;
  availableShares?: number;
  floorPrice?: number;
  revenueStreams?: RevenueStream[];
}

export interface RevenueStream {
  id: string;
  name: string;
  tokenAddress: string;
  totalRevenue: number;
  distributedRevenue: number;
  pendingRevenue: number;
  distributionThreshold: number;
  isActive: boolean;
}

export interface CompatibilityInfo {
  platforms: Platform[];
  minVersion?: string;
  requirements?: string[];
  dependencies?: string[];
}

export interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  details: string;
  remediation?: string;
}

export interface SecurityPosture {
  trustScore: number;
  issues: SecurityIssue[];
  authMethods: string[];
  lastAudit?: Date;
  auditedBy?: string;
}

/**
 * Base marketplace asset interface
 */
export interface MarketplaceAsset {
  // Identity
  id: string;
  type: AssetType;
  slug: string;
  externalId?: string;
  source?: 'tnf' | 'mcp-drs';

  // Metadata
  name: string;
  description: string;
  longDescription?: string;
  author: AuthorInfo;
  version: string;
  tags: string[];
  category: string;

  // Media
  iconUrl?: string;
  bannerUrl?: string;
  screenshots?: string[];
  demoUrl?: string;
  videoUrl?: string;

  // Discovery
  capabilities: string[];
  compatibility: CompatibilityInfo;
  searchableText?: string;

  // Quality & Trust
  trustScore: number;
  communityRating: number;
  reviewCount: number;
  downloadCount: number;
  usageCount: number;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  isFeatured: boolean;

  // Pricing
  pricing: PricingModel;

  // NFT (optional)
  nft?: NFTInfo;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

// ============================================
// MCP Server Asset
// ============================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface MCPResource {
  name: string;
  uri: string;
  mimeType?: string;
  description?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  template: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface TransportConfig {
  transport: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

export interface MCPServerAsset extends MarketplaceAsset {
  type: 'MCP_SERVER';
  transportConfig: TransportConfig;
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
  securityPosture: SecurityPosture;
  repositoryUrl?: string;
  documentationUrl?: string;
  installCommand?: string;
}

// ============================================
// Skill Asset
// ============================================

export interface SkillParameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: unknown;
  enum?: unknown[];
}

export interface SkillExample {
  title: string;
  input: Record<string, unknown>;
  output?: string;
  description?: string;
}

export interface SkillAsset extends MarketplaceAsset {
  type: 'SKILL';
  skillContent: string;
  parameters: SkillParameter[];
  examples: SkillExample[];
  relatedSkills: string[];
  triggerCommands?: string[];
}

// ============================================
// Prompt Asset
// ============================================

export interface PromptVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  default?: unknown;
  placeholder?: string;
}

export interface PromptTestResult {
  model: string;
  input: Record<string, unknown>;
  output: string;
  tokens: number;
  latencyMs: number;
  rating?: number;
  testedAt: Date;
}

export interface PromptAsset extends MarketplaceAsset {
  type: 'PROMPT';
  promptContent: string;
  variables: PromptVariable[];
  targetModels: ('claude' | 'gpt' | 'gemini' | 'llama' | 'mistral')[];
  useCase: string;
  expectedOutput?: string;
  testResults?: PromptTestResult[];
  systemPrompt?: boolean;
}

// ============================================
// Prompt Pack Asset
// ============================================

export interface PromptPackAsset extends MarketplaceAsset {
  type: 'PROMPT_PACK';
  prompts: PromptAsset[];
  theme: string;
  useCases: string[];
  totalPrompts: number;
}

// ============================================
// Agent Asset
// ============================================

export interface AgentCapability {
  name: string;
  type: string;
  version: string;
  parameters?: Record<string, unknown>;
  verificationStatus: VerificationStatus;
}

export interface AgentMetrics {
  successRate: number;
  avgResponseTime: number;
  totalExecutions: number;
  errorRate: number;
  userSatisfaction: number;
  uptimePercent: number;
}

export interface AgentConfiguration {
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt: string;
  tools?: string[];
  skills?: string[];
  mcpServers?: string[];
}

export interface AgentAsset extends MarketplaceAsset {
  type: 'AGENT';
  agentConfig: AgentConfiguration;
  capabilities: AgentCapability[];
  integrations: string[];
  skills: string[];
  performanceMetrics: AgentMetrics;
  registrationStatus: VerificationStatus;
  certificationTier?: 'basic' | 'verified' | 'certified' | 'premium';
}

// ============================================
// Search & Filter Types
// ============================================

export interface MarketplaceSearchParams {
  q?: string;
  type?: AssetType[];
  category?: string[];
  tags?: string[];
  author?: string;
  minRating?: number;
  maxRating?: number;
  minTrust?: number;
  pricing?: PricingType[];
  verified?: boolean;
  featured?: boolean;
  platforms?: Platform[];
  sort?: 'popular' | 'recent' | 'rating' | 'price' | 'downloads';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchFacets {
  types: Record<AssetType, number>;
  categories: Record<string, number>;
  pricing: Record<PricingType, number>;
  platforms: Record<Platform, number>;
  tags: Record<string, number>;
}

export interface MarketplaceSearchResult {
  total: number;
  assets: MarketplaceAsset[];
  facets: SearchFacets;
  took: number;
}

// ============================================
// Installation Types
// ============================================

export interface InstallConfig {
  assetId: string;
  assetType: AssetType;
  platform: Platform;
  config: Record<string, unknown>;
  instructions?: string;
}

export interface InstallResult {
  success: boolean;
  assetId: string;
  installedAt: Date;
  config: InstallConfig;
  error?: string;
}

// ============================================
// Purchase Types
// ============================================

export interface PurchaseRequest {
  assetId: string;
  buyerId: string;
  paymentMethod: 'stripe' | 'crypto' | 'credits';
  quantity?: number;
  shares?: number;
}

export interface PurchaseResult {
  success: boolean;
  transactionId: string;
  assetId: string;
  amount: number;
  currency: Currency;
  nftTokenId?: string;
  txHash?: string;
}

// ============================================
// Listing Types
// ============================================

export interface CreateListingRequest {
  assetId: string;
  shareAmount: number;
  pricePerShare: number;
  duration: number;
}

export interface MarketplaceListing {
  id: string;
  assetId: string;
  seller: string;
  shareAmount: number;
  pricePerShare: number;
  totalPrice: number;
  status: 'ACTIVE' | 'SOLD' | 'CANCELLED' | 'EXPIRED';
  createdAt: Date;
  expiresAt: Date;
}

export interface MarketplaceOffer {
  id: string;
  listingId: string;
  buyer: string;
  shareAmount: number;
  offerPrice: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  createdAt: Date;
  expiresAt: Date;
}
