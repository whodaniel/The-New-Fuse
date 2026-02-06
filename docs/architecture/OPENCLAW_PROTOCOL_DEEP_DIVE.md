# OpenClaw Protocol Deep Dive

## Executive Summary

This document provides a comprehensive analysis of OpenClaw's architecture,
focusing on the model provider system, authentication mechanisms, and
configuration management. The goal is to understand and eventually assimilate
these capabilities into The New Fuse (TNF).

---

## 1. Architecture Overview

OpenClaw is a modular AI agent runtime with the following key components:

```
┌─────────────────────────────────────────────────────────────────┐
│                      OpenClaw Runtime                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Gateway   │  │   Agents    │  │      Plugin System      │  │
│  │  (HTTP/WS)  │  │  (Runners)  │  │  (Providers, Channels)  │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                 │
│  ┌──────┴────────────────┴─────────────────────┴──────────────┐ │
│  │                    Config System                            │ │
│  │  (~/.openclaw/openclaw.json + agents/<id>/agent/*.json)    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Model Provider System

### 2.1 Configuration Structure (`ModelsConfig`)

Located in: `src/config/types.models.ts`

```typescript
type ModelsConfig = {
  mode?: 'merge' | 'replace'; // How to combine with defaults
  providers?: Record<string, ModelProviderConfig>;
  bedrockDiscovery?: BedrockDiscoveryConfig; // AWS Bedrock auto-discovery
};
```

### 2.2 Model Provider Configuration

Each provider follows this schema:

```typescript
type ModelProviderConfig = {
  baseUrl: string; // API endpoint
  apiKey?: string; // Static API key (if applicable)
  auth?: ModelProviderAuthMode; // 'api-key' | 'aws-sdk' | 'oauth' | 'token'
  api?: ModelApi; // API format: 'openai-completions', 'anthropic-messages', etc.
  headers?: Record<string, string>; // Custom headers
  authHeader?: boolean; // Whether to send Authorization header
  models: ModelDefinitionConfig[]; // Available models
};
```

### 2.3 Model Definition

```typescript
type ModelDefinitionConfig = {
  id: string; // e.g., "glm-4.7-free"
  name: string; // Display name
  api?: ModelApi; // Override provider-level API
  reasoning: boolean; // Supports extended thinking
  input: Array<'text' | 'image'>; // Input modalities
  cost: {
    input: number; // $/1M input tokens
    output: number; // $/1M output tokens
    cacheRead: number;
    cacheWrite: number;
  };
  contextWindow: number; // Max context length
  maxTokens: number; // Max output tokens
  headers?: Record<string, string>; // Model-specific headers
  compat?: ModelCompatConfig; // Compatibility flags
};
```

### 2.4 Supported API Formats

```typescript
type ModelApi =
  | 'openai-completions' // OpenAI-compatible /v1/chat/completions
  | 'openai-responses' // OpenAI with response_format
  | 'anthropic-messages' // Anthropic Messages API
  | 'google-generative-ai' // Google Generative AI
  | 'github-copilot' // GitHub Copilot protocol
  | 'bedrock-converse-stream'; // AWS Bedrock Converse
```

---

## 3. Authentication System

### 3.1 Auth Profile Store

Located at: `~/.openclaw/agents/<agent-id>/agent/auth-profiles.json`

```typescript
type AuthProfileStore = {
  version: number;
  profiles: Record<string, AuthProfileCredential>;
  order?: Record<string, string[]>; // Provider->ProfileIDs for failover
  lastGood?: Record<string, string>; // Last working profile per provider
  usageStats?: Record<string, ProfileUsageStats>; // Rotation tracking
};
```

### 3.2 Credential Types

```typescript
// API Key (static)
type ApiKeyCredential = {
  type: 'api_key';
  provider: string;
  key: string;
  email?: string;
};

// OAuth (refreshable)
type OAuthCredential = {
  type: 'oauth';
  provider: string;
  access: string; // Access token
  refresh: string; // Refresh token
  expires: number; // Expiry timestamp (ms)
  email?: string;
  projectId?: string; // For Google APIs
};

// Token (static bearer)
type TokenCredential = {
  type: 'token';
  provider: string;
  token: string;
  expires?: number;
  email?: string;
};
```

### 3.3 Profile Failure Handling

```typescript
type AuthProfileFailureReason =
  | 'auth' // 401/403
  | 'format' // Invalid request/response
  | 'rate_limit' // 429
  | 'billing' // Quota exceeded
  | 'timeout' // Request timeout
  | 'unknown';

type ProfileUsageStats = {
  lastUsed?: number;
  cooldownUntil?: number;
  disabledUntil?: number;
  disabledReason?: AuthProfileFailureReason;
  errorCount?: number;
  failureCounts?: Partial<Record<AuthProfileFailureReason, number>>;
  lastFailureAt?: number;
};
```

---

## 4. Plugin System

### 4.1 Provider Plugin Interface

Plugins can register LLM providers dynamically:

```typescript
type ProviderPlugin = {
  id: string; // e.g., "kilocode"
  label: string; // Display name
  docsPath?: string; // Path to docs
  aliases?: string[]; // Alternative IDs
  envVars?: string[]; // Auto-detected env vars for auth
  models?: ModelProviderConfig; // Static model definitions
  auth: ProviderAuthMethod[]; // Authentication methods
  formatApiKey?: (cred) => string; // Custom API key formatting
  refreshOAuth?: (cred) => Promise<OAuthCredential>; // Token refresh
};
```

### 4.2 Authentication Methods

```typescript
type ProviderAuthMethod = {
  id: string; // e.g., "oauth", "api_key"
  label: string; // Display label
  hint?: string; // Help text
  kind: 'oauth' | 'api_key' | 'token' | 'device_code' | 'custom';
  run: (ctx: ProviderAuthContext) => Promise<ProviderAuthResult>;
};

type ProviderAuthResult = {
  profiles: Array<{
    profileId: string;
    credential: AuthProfileCredential;
  }>;
  configPatch?: Partial<OpenClawConfig>; // Config updates
  defaultModel?: string; // Set as primary
  notes?: string[]; // User messages
};
```

### 4.3 Plugin API

The full plugin API available to all plugins:

```typescript
type OpenClawPluginApi = {
  id: string;
  config: OpenClawConfig;
  pluginConfig?: Record<string, unknown>;
  logger: PluginLogger;

  // Registration methods
  registerTool: (tool, opts?) => void;
  registerHook: (events, handler, opts?) => void;
  registerHttpHandler: (handler) => void;
  registerHttpRoute: ({ path, handler }) => void;
  registerChannel: (registration) => void;
  registerGatewayMethod: (method, handler) => void;
  registerCli: (registrar, opts?) => void;
  registerService: (service) => void;
  registerProvider: (provider) => void; // <-- Key for LLM providers
  registerCommand: (command) => void;

  // Lifecycle hooks
  on: <K>(hookName, handler, opts?) => void;
};
```

---

## 5. Model Selection & Resolution

### 5.1 Model Reference Format

Models are referenced as `provider/model`:

- `anthropic/claude-sonnet-4`
- `google/gemini-3-flash`
- `kilocode/glm-4.7-free`

### 5.2 Resolution Flow

```
User Input → Alias Resolution → Provider Normalization → Allowlist Check → Model Catalog
     ↓              ↓                    ↓                    ↓              ↓
"flash"     → "gemini-3-flash"  → "google/..."       → Check allowed  → Get metadata
```

### 5.3 Key Functions (from `model-selection.ts`)

```typescript
// Parse "provider/model" string
parseModelRef(raw: string, defaultProvider: string): ModelRef | null

// Resolve alias like "flash" → "google/gemini-3-flash"
resolveModelRefFromString(params): { ref: ModelRef; alias?: string } | null

// Get default model for an agent
resolveDefaultModelForAgent(params: { cfg, agentId? }): ModelRef

// Build set of allowed models from config
buildAllowedModelSet(params): { allowAny, allowedCatalog, allowedKeys }

// Resolve with allowlist validation
resolveAllowedModelRef(params): { ref, key } | { error }
```

---

## 6. Configuration Hierarchy

### 6.1 File Locations

```
~/.openclaw/
├── openclaw.json              # Main config (models, providers, channels)
├── agents/
│   └── main/
│       └── agent/
│           ├── auth-profiles.json  # Credentials
│           ├── models.json         # Model catalog cache
│           └── auth.json           # Legacy (migrated)
└── extensions/
    └── <plugin-id>/
        ├── index.ts               # Plugin entry
        └── openclaw.plugin.json   # Plugin manifest
```

### 6.2 Config Schema (`openclaw.json`)

```typescript
type OpenClawConfig = {
  meta?: { lastTouchedVersion, lastTouchedAt };

  // Model configuration
  models?: ModelsConfig;

  // Authentication
  auth?: {
    profiles?: Record<string, AuthProfileConfig>;
    order?: Record<string, string[]>;  // Failover order
    cooldowns?: { billingBackoffHours, billingMaxHours, ... };
  };

  // Agent configuration
  agents?: {
    defaults?: {
      model?: { primary: string } | string;  // Default model
      models?: Record<string, { alias?: string }>;  // Allowlist + aliases
      thinkingDefault?: ThinkLevel;
      sandbox?: { mode, workspaceAccess, ... };
      maxConcurrent?: number;
      subagents?: { maxConcurrent? };
    };
    list?: AgentEntry[];  // Agent definitions
  };

  // Channels (Telegram, Discord, etc.)
  channels?: { telegram, discord, slack, ... };

  // Gateway
  gateway?: { port, mode, bind, auth };

  // Plugins
  plugins?: {
    entries?: Record<string, { enabled: boolean, ... }>;
  };

  // Tools
  tools?: { agentToAgent, elevated, ... };
}
```

---

## 7. Fallback & Rotation System

### 7.1 Profile Order (auth.order)

```json
{
  "auth": {
    "order": {
      "anthropic": ["anthropic:work", "anthropic:personal"],
      "google": ["google-gemini-cli:owner@example.com"]
    }
  }
}
```

### 7.2 Failover Logic

1. Try profiles in order from `auth.order[provider]`
2. If all fail with `billing`, apply exponential backoff
3. If all fail with `auth`, mark provider as unavailable
4. Track `lastGood` for quick recovery

### 7.3 Cooldown Configuration

```json
{
  "auth": {
    "cooldowns": {
      "billingBackoffHours": 1, // Initial backoff
      "billingMaxHours": 24, // Max backoff cap
      "failureWindowHours": 1 // Window to count failures
    }
  }
}
```

---

## 8. Integration Points for TNF

### 8.1 What to Assimilate

1. **Model Provider Plugin System**: Create a TNF plugin that can register
   providers dynamically
2. **Auth Profile Store**: Adopt the multi-profile, multi-credential approach
3. **Model Catalog**: Maintain a catalog of available models with metadata
4. **Fallback/Rotation**: Implement automatic failover between providers
5. **Configuration UI**: Build a user-friendly interface for:
   - Adding/removing API keys
   - Setting primary model
   - Configuring fallback order
   - Managing provider-specific settings

### 8.2 Key APIs to Expose

```typescript
// TNF Provider Manager
interface ProviderManager {
  // Registration
  registerProvider(config: ProviderConfig): void;
  unregisterProvider(id: string): void;

  // Discovery
  listProviders(): ProviderInfo[];
  listModels(providerId?: string): ModelInfo[];

  // Configuration
  setPrimaryModel(modelRef: string): void;
  setFallbackOrder(providerId: string, profileIds: string[]): void;

  // Credentials
  addCredential(providerId: string, credential: Credential): Promise<string>;
  removeCredential(profileId: string): void;
  listCredentials(providerId?: string): CredentialInfo[];

  // Resolution
  resolveModel(input: string): ModelRef | null;
  getActiveCredential(providerId: string): Credential | null;
}
```

### 8.3 UI Requirements

1. **Provider Picker**: Visual grid of providers with status indicators
2. **API Key Manager**: Secure input, validation, and testing
3. **Model Selector**: Searchable list with cost/capability info
4. **Fallback Configuration**: Drag-and-drop ordering
5. **Usage Dashboard**: Per-provider quota and cost tracking

---

## 9. Next Steps

1. [ ] Create `@the-new-fuse/provider-registry` package
2. [ ] Implement `CredentialStore` service with encryption
3. [ ] Build `ModelCatalog` service with provider aggregation
4. [ ] Design Settings UI for provider management
5. [ ] Integrate with ClawdEngine for seamless model switching
6. [ ] Add telemetry for usage tracking and cost estimation

---

## 10. Appendix: Example Plugin (Kilo Code)

```typescript
export default function (api: OpenClawPluginApi) {
  // Register HTTP route for proxying
  api.registerHttpRoute({
    path: '/v1/chat/completions',
    handler: async (req, res) => {
      // Proxy logic here
    },
  });

  // Register provider
  api.registerProvider({
    id: 'kilocode',
    label: 'Kilo Code (Free)',
    models: {
      baseUrl: 'http://localhost:18789/v1',
      api: 'openai-completions',
      models: [
        {
          id: 'glm-4.7-free',
          name: 'GLM-4.7 (Free)',
          reasoning: true,
          input: ['text'],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow: 128000,
          maxTokens: 8192,
        },
      ],
    },
    auth: [
      {
        id: 'none',
        label: 'Free Access',
        kind: 'custom',
        run: async () => ({
          profiles: [
            {
              profileId: 'kilocode:free',
              credential: {
                type: 'token',
                provider: 'kilocode',
                token: 'none',
              },
            },
          ],
        }),
      },
    ],
  });
}
```

---

_Document generated: 2026-02-04_ _Author: Antigravity AI Assistant_
