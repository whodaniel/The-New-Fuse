# Unified AI Agent Assets Marketplace

## Vision

A comprehensive marketplace at `marketplace.thenewfuse.com` combining MCP-DRS
discovery capabilities with The New Fuse's NFT/blockchain infrastructure to
create the definitive AI Agent Assets marketplace.

## Asset Categories

### 1. MCP Servers & Tools

- Discovered and vetted MCP servers
- Trust scoring and security posture
- Installation configs for Claude, Gemini, Cursor, etc.
- **Source**: MCP-DRS crawler/processor pipeline

### 2. Skills

- Reusable skill definitions (.md files)
- Skill templates and generators
- Workflow skill bundles
- **Source**: TNF Skills MCP Server

### 3. Prompts & Prompt Collections

- Individual prompts with versioning
- Curated prompt packs (e.g., "Code Review Pack")
- System prompts for specific use cases
- **NEW**: Prompt testing/validation before listing

### 4. Complete Agents

- Registered and validated agents
- Agent configurations + capabilities
- Agent NFTs with optional fractionalization
- Revenue-generating agents with profit sharing
- **Source**: TNF Agent Registry

---

## Technical Architecture

```
                    ┌─────────────────────────────────────────────────┐
                    │           marketplace.thenewfuse.com            │
                    │              (Next.js Frontend)                 │
                    └─────────────────────────────────────────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    │                                           │
              ┌─────▼─────┐                            ┌────────▼────────┐
              │  TNF API  │                            │   MCP-DRS API   │
              │ (NestJS)  │◄──────────────────────────►│     (Go)        │
              └─────┬─────┘    Federated Search        └────────┬────────┘
                    │                                           │
        ┌───────────┼───────────┐                   ┌───────────┼───────────┐
        │           │           │                   │           │           │
   ┌────▼────┐ ┌────▼────┐ ┌────▼────┐        ┌────▼────┐ ┌────▼────┐ ┌────▼────┐
   │PostgreSQL│ │  Redis  │ │Blockchain│        │ MongoDB │ │  ES     │ │  Redis  │
   │(Drizzle) │ │ (Queue) │ │(Smart   │        │(Servers)│ │(Search) │ │ (Queue) │
   └──────────┘ └─────────┘ │Contracts)│        └─────────┘ └─────────┘ └─────────┘
                            └──────────┘
```

---

## Unified Data Model

### MarketplaceAsset (Base)

```typescript
interface MarketplaceAsset {
  // Identity
  id: string;
  type: 'MCP_SERVER' | 'SKILL' | 'PROMPT' | 'PROMPT_PACK' | 'AGENT';
  slug: string; // URL-friendly identifier

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

  // Discovery
  capabilities: string[];
  compatibility: CompatibilityInfo;

  // Quality & Trust
  trustScore: number; // 0-100 (from vetting)
  communityRating: number; // 0-5 stars
  reviewCount: number;
  downloadCount: number;
  isVerified: boolean; // TNF verification
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

interface AuthorInfo {
  id: string;
  name: string;
  avatarUrl?: string;
  isVerified: boolean;
  reputation: number;
  assetCount: number;
}

interface PricingModel {
  type: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION' | 'PAY_PER_USE' | 'REVENUE_SHARE';
  price?: number; // One-time price in USD
  currency: 'USD' | 'ETH' | 'MATIC' | 'FUSE';
  subscriptionPeriod?: 'MONTHLY' | 'YEARLY';
  usageRate?: number; // Per-use cost
  revenueSharePercent?: number; // For revenue-share model
  trialDays?: number;
}

interface NFTInfo {
  tokenId: string;
  contractAddress: string;
  chain: 'ethereum' | 'polygon' | 'tnf-chain';
  isFractionalized: boolean;
  totalShares?: number;
  availableShares?: number;
  floorPrice?: number;
  revenueStreams?: RevenueStream[];
}

interface CompatibilityInfo {
  platforms: (
    | 'claude-desktop'
    | 'claude-code'
    | 'gemini-cli'
    | 'cursor'
    | 'vscode'
  )[];
  minVersion?: string;
  requirements?: string[];
}
```

### Asset-Specific Extensions

```typescript
// MCP Server Asset
interface MCPServerAsset extends MarketplaceAsset {
  type: 'MCP_SERVER';
  transportConfig: {
    transport: 'stdio' | 'http' | 'sse';
    command?: string;
    args?: string[];
    url?: string;
  };
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
  securityPosture: {
    trustScore: number;
    issues: SecurityIssue[];
    authMethods: string[];
  };
  repositoryUrl?: string;
}

// Skill Asset
interface SkillAsset extends MarketplaceAsset {
  type: 'SKILL';
  skillContent: string; // Markdown content
  parameters: SkillParameter[];
  examples: SkillExample[];
  relatedSkills: string[]; // Other skill IDs
}

// Prompt Asset
interface PromptAsset extends MarketplaceAsset {
  type: 'PROMPT';
  promptContent: string;
  variables: PromptVariable[];
  targetModels: ('claude' | 'gpt' | 'gemini' | 'llama')[];
  useCase: string;
  expectedOutput?: string;
  testResults?: PromptTestResult[];
}

// Prompt Pack Asset
interface PromptPackAsset extends MarketplaceAsset {
  type: 'PROMPT_PACK';
  prompts: PromptAsset[];
  theme: string;
  useCases: string[];
}

// Agent Asset
interface AgentAsset extends MarketplaceAsset {
  type: 'AGENT';
  agentConfig: AgentConfiguration;
  capabilities: AgentCapability[];
  integrations: string[]; // MCP server IDs
  skills: string[]; // Skill IDs
  systemPrompt: string;
  performanceMetrics: AgentMetrics;
  registrationStatus: 'PENDING' | 'VERIFIED' | 'CERTIFIED';
}
```

---

## API Design

### Unified Search Endpoint

```
GET /api/v1/marketplace/search
```

Query Parameters:

- `q` - Full-text search query
- `type` - Asset type filter (comma-separated)
- `category` - Category filter
- `tags` - Tag filter (comma-separated)
- `author` - Author ID
- `minRating` - Minimum community rating
- `minTrust` - Minimum trust score
- `pricing` - Pricing type filter
- `verified` - Only verified assets
- `featured` - Only featured assets
- `sort` - Sort field (popular, recent, rating, price)
- `order` - Sort order (asc, desc)
- `limit` - Results per page
- `offset` - Pagination offset

Response:

```json
{
  "total": 1247,
  "assets": [
    {
      "id": "mcp-email-server",
      "type": "MCP_SERVER",
      "name": "Email MCP Server",
      "description": "Send emails via MCP",
      "author": {"name": "Anthropic", "isVerified": true},
      "trustScore": 95,
      "communityRating": 4.8,
      "pricing": {"type": "FREE"},
      "isVerified": true
    }
  ],
  "facets": {
    "types": {"MCP_SERVER": 450, "SKILL": 320, "PROMPT": 280, "AGENT": 197},
    "categories": {"automation": 234, "development": 456, ...},
    "pricing": {"FREE": 800, "ONE_TIME": 300, "SUBSCRIPTION": 147}
  }
}
```

### Asset CRUD Endpoints

```
# List assets (public)
GET /api/v1/marketplace/assets

# Get asset by ID (public)
GET /api/v1/marketplace/assets/:id

# Create asset (authenticated, author only)
POST /api/v1/marketplace/assets

# Update asset (authenticated, author only)
PUT /api/v1/marketplace/assets/:id

# Delete asset (authenticated, author only)
DELETE /api/v1/marketplace/assets/:id

# Submit for verification (authenticated)
POST /api/v1/marketplace/assets/:id/verify

# Feature asset (admin only)
POST /api/v1/marketplace/assets/:id/feature
```

### Purchase & Install Endpoints

```
# Install free asset
POST /api/v1/marketplace/assets/:id/install

# Purchase asset (redirects to payment/NFT)
POST /api/v1/marketplace/assets/:id/purchase

# Get installation config
GET /api/v1/marketplace/assets/:id/install-config

# Track usage (for pay-per-use)
POST /api/v1/marketplace/assets/:id/usage
```

### NFT & Blockchain Endpoints

```
# Mint asset as NFT
POST /api/v1/marketplace/assets/:id/mint

# List shares for sale
POST /api/v1/marketplace/assets/:id/list-shares

# Buy shares
POST /api/v1/marketplace/listings/:listingId/buy

# Make offer
POST /api/v1/marketplace/listings/:listingId/offer

# Revenue distribution
POST /api/v1/marketplace/assets/:id/distribute-revenue
```

---

## Implementation Phases

### Phase 1: Unified API Gateway (Week 1-2)

1. Create API gateway in TNF that federates to MCP-DRS
2. Unified authentication (share JWT/session between services)
3. Cross-service search aggregation
4. Shared asset type definitions

**Files to Create:**

```
packages/marketplace-gateway/
├── src/
│   ├── gateway.service.ts      # API federation
│   ├── search.service.ts       # Unified search
│   ├── auth.middleware.ts      # Shared auth
│   └── types/
│       └── unified-asset.ts    # Shared types
├── package.json
└── tsconfig.json
```

### Phase 2: Prompt Marketplace (Week 2-3)

1. Add prompt/prompt-pack asset types to database
2. Create prompt submission UI
3. Prompt testing/validation pipeline
4. Prompt versioning system

**Database Additions:**

```sql
-- Prompts table
CREATE TABLE marketplace_prompts (
  id UUID PRIMARY KEY,
  asset_id UUID REFERENCES marketplace_assets(id),
  content TEXT NOT NULL,
  variables JSONB,
  target_models TEXT[],
  use_case TEXT,
  test_results JSONB,
  version VARCHAR(20)
);

-- Prompt packs table
CREATE TABLE marketplace_prompt_packs (
  id UUID PRIMARY KEY,
  asset_id UUID REFERENCES marketplace_assets(id),
  theme VARCHAR(100),
  use_cases TEXT[]
);

-- Prompt pack items junction
CREATE TABLE prompt_pack_items (
  pack_id UUID REFERENCES marketplace_prompt_packs(id),
  prompt_id UUID REFERENCES marketplace_prompts(id),
  order_index INT,
  PRIMARY KEY (pack_id, prompt_id)
);
```

### Phase 3: Agent Certification (Week 3-4)

1. Agent verification workflow
2. Certification tiers (Verified, Certified, Premium)
3. Performance metrics tracking
4. Revenue share setup for certified agents

**Certification Tiers:**

- **Verified**: Basic validation, passes automated tests
- **Certified**: Manual review, security audit, 30-day track record
- **Premium**: Full audit, SLA guarantee, dedicated support

### Phase 4: Skills Integration (Week 4-5)

1. Connect TNF Skills MCP Server to marketplace
2. Skill submission and validation
3. Skill bundles/packages
4. Cross-linking skills to agents

### Phase 5: NFT & Revenue Features (Week 5-6)

1. Asset minting as NFTs
2. Fractional ownership for high-value agents
3. Revenue streaming for pay-per-use assets
4. Marketplace fee collection (15-30%)

---

## Subdomain Setup

### DNS Configuration

```
marketplace.thenewfuse.com  →  Vercel/Railway deployment
api.marketplace.thenewfuse.com  →  TNF API Gateway
mcp.marketplace.thenewfuse.com  →  MCP-DRS API (proxy)
```

### Vercel Configuration (vercel.json)

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.marketplace.thenewfuse.com/:path*"
    },
    {
      "source": "/mcp/:path*",
      "destination": "https://mcp-drs-api-production.up.railway.app/:path*"
    }
  ]
}
```

---

## Revenue Model

### Platform Fees

| Asset Type  | Free Listing | Sale Fee | Featured | Certification |
| ----------- | ------------ | -------- | -------- | ------------- |
| MCP Server  | Yes          | 15%      | $49/mo   | $299          |
| Skill       | Yes          | 20%      | $29/mo   | $99           |
| Prompt      | Yes          | 25%      | $19/mo   | $49           |
| Prompt Pack | Yes          | 20%      | $29/mo   | $99           |
| Agent       | Yes          | 30%      | $99/mo   | $499          |

### Revenue Sharing (NFT Holders)

For fractionalized assets:

- 70% to share holders (pro-rata)
- 20% to original creator
- 10% to platform

### Subscription Tiers (Buyers)

| Tier       | Price  | Credits            | Benefits                             |
| ---------- | ------ | ------------------ | ------------------------------------ |
| Free       | $0     | 5 installs/month   | Basic access                         |
| Pro        | $19/mo | 50 installs/month  | Priority support, early access       |
| Team       | $49/mo | 200 installs/month | Team sharing, analytics              |
| Enterprise | Custom | Unlimited          | SLA, dedicated support, custom terms |

---

## Migration Strategy

### MCP-DRS Data Migration

1. Keep MCP-DRS as independent service
2. Create sync job to mirror servers to TNF marketplace
3. MCP-DRS handles discovery/vetting
4. TNF handles commerce/NFT

```typescript
// Sync job (runs every 15 minutes)
async function syncMCPServersToMarketplace() {
  const servers = await mcpDrsClient.getRecentlyUpdatedServers();

  for (const server of servers) {
    await marketplaceService.upsertAsset({
      type: 'MCP_SERVER',
      externalId: server.server_id,
      source: 'mcp-drs',
      ...mapServerToAsset(server),
    });
  }
}
```

### TNF Marketplace Migration

1. Add new asset types to existing schema
2. Migrate existing agent listings to new format
3. Add prompt/skill tables
4. Update frontend components

---

## Next Steps

1. [ ] Create `packages/marketplace-gateway` in TNF
2. [ ] Add unified asset types to `packages/types`
3. [ ] Extend database schema for prompts
4. [ ] Create sync service for MCP-DRS integration
5. [ ] Set up subdomain routing
6. [ ] Build prompt submission UI
7. [ ] Implement agent certification workflow
8. [ ] Deploy to marketplace.thenewfuse.com

---

## Related Documents

- [MCP-DRS Monetization Guide](../../MCP-DRS/MONETIZATION_GUIDE.md)
- [TNF NFT Marketplace](../apps/frontend/src/pages/web3/NFTMarketplace.tsx)
- [Agent Registration System](../packages/database/src/drizzle/schema/agents.ts)
- [Smart Contract Service](../apps/backend/src/services/smart-contract.service.ts)
