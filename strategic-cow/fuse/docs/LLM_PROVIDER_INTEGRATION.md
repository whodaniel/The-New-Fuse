# LLM Provider Integration Guide

**The New Fuse Multi-Provider LLM Architecture**

Complete guide for integrating and using Anthropic Claude, Google Gemini, and
other LLM providers with The New Fuse framework.

---

## Table of Contents

- [Overview](#overview)
- [Supported Providers](#supported-providers)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Cost Optimization](#cost-optimization)
- [Provider-Specific Features](#provider-specific-features)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Overview

The New Fuse supports multiple LLM providers through a unified interface,
enabling:

- **Provider Flexibility**: Switch between OpenAI, Anthropic, Gemini, and others
- **Cost Optimization**: Automatic routing to the most cost-effective provider
- **Fallback Mechanisms**: Graceful degradation if primary provider fails
- **Feature Parity**: Consistent API across different providers
- **Type Safety**: Full TypeScript support

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│               LLM Provider Service (NestJS)                  │
│           - CRUD operations                                  │
│           - Provider registration                            │
│           - Configuration management                         │
├─────────────────────────────────────────────────────────────┤
│            Cost-Optimized Router                             │
│           - Capability matching                              │
│           - Cost analysis                                    │
│           - Load balancing                                   │
├─────────────────────────────────────────────────────────────┤
│        Provider Implementations (Abstract LLMProvider)       │
│   ┌──────────┬──────────┬──────────┬──────────────────┐    │
│   │ OpenAI   │ Anthropic│  Gemini  │  LiteLLM (Proxy) │    │
│   │ Provider │ Provider │ Provider │     Provider     │    │
│   └──────────┴──────────┴──────────┴──────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Provider SDKs                             │
│   ┌──────────┬──────────┬──────────┬──────────────────┐    │
│   │  OpenAI  │ Anthropic│  Google  │     LiteLLM      │    │
│   │   SDK    │   SDK    │ Gen AI   │      Proxy       │    │
│   └──────────┴──────────┴──────────┴──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Supported Providers

### Anthropic Claude

| Model                      | Intelligence | Cost/Task | Use Case                     |
| -------------------------- | ------------ | --------- | ---------------------------- |
| claude-3-5-haiku-20241022  | Level 3      | $0.08     | Fast responses, simple tasks |
| claude-3-5-sonnet-20241022 | Level 4      | $0.45     | Production workhorse         |
| claude-3-opus-20240229     | Level 5      | $1.80     | Complex reasoning, research  |

**Features**:

- Extended context (200K tokens)
- Vision capabilities (all models)
- Prompt caching (reduce costs)
- Streaming support
- High success rate (96-98%)

### Google Gemini

| Model                   | Intelligence | Cost/Task | Use Case                     |
| ----------------------- | ------------ | --------- | ---------------------------- |
| gemini-2.0-flash-exp    | Level 3      | $0.06     | Fastest, cheapest            |
| gemini-1.5-flash-latest | Level 3      | $0.07     | Balanced speed/cost          |
| gemini-1.5-pro-latest   | Level 4      | $0.35     | Extended context (2M tokens) |

**Features**:

- Multimodal (text, images, video, audio)
- Massive context (up to 2M tokens)
- Function calling
- Grounding with Google Search
- Native token counting API

### OpenAI

| Model       | Intelligence | Cost/Task | Use Case           |
| ----------- | ------------ | --------- | ------------------ |
| gpt-4o-mini | Level 3      | $0.10     | Fast, affordable   |
| gpt-4o      | Level 4      | $0.50     | Production default |
| gpt-4o      | Level 4      | $0.50     | Production default |
| gpt-4-turbo | Level 4      | $0.60     | Extended context   |

### Kilo (Free Tier Available)

Kilo provides access to powerful free models like GLM 5.0 and MiniMax via a
unified gateway.

| Model             | Intelligence | Cost/Task | Use Case                 |
| ----------------- | ------------ | --------- | ------------------------ |
| z-ai/glm-5:free   | Level 4      | $0.00     | **Best free model**      |
| minimax-m2.5:free | Level 3.5    | $0.00     | Fast, capable free model |

**Features**:

- Truly free tier models
- OpenAI-compatible API
- High availability
- Direct integration in PicoClaw & OpenClaw

### LiteLLM (Proxy)

LiteLLM provides a unified interface to **100+ LLM providers**:

- All OpenAI-compatible models
- Azure OpenAI
- AWS Bedrock
- Vertex AI
- Cohere, Mistral, DeepSeek, Qwen, etc.

### OpenCode (Recommended for Local/Private)

OpenCode is a specialized provider for local execution and private deployments,
supporting both CLI-based (local) and API-based (remote/containerized)
interactions.

| Mode    | Use Case                                     | Setup                              |
| ------- | -------------------------------------------- | ---------------------------------- |
| **CLI** | Local development, direct binary execution   | Requires `opencode` binary in path |
| **API** | Server/Container deployment, shared instance | Requires `opencode-server` running |

**Features**:

- **Dual Mode**: Seamlessly switch between local CLI and remote API.
- **Tool Execution**: Native support for executing local tools (CLI mode).
- **Session Management**: Persistent sessions for stateful interactions.
- **Secure**: Optional password protection for API access.

#### OpenCode Configuration

**Environment Variables**:

```bash
# OpenCode API (Server-based)
OPENCODE_API_KEY=your_api_key
OPENCODE_BASE_URL=http://localhost:4096
OPENCODE_SERVER_PASSWORD=your_password
OPENCODE_MODEL=anthropic/claude-sonnet-4-5

# OpenCode CLI
OPENCODE_CLI_PATH=opencode
OPENCODE_CLI_MODEL=anthropic/claude-sonnet-4-5
```

**Provider Implementations**:

```typescript
// OpenCode API Provider
import { OpenCodeApiProvider } from '@the-new-fuse/core/llm/providers';

const opencodeApi = new OpenCodeApiProvider({
  apiKey: process.env.OPENCODE_API_KEY,
  baseURL: process.env.OPENCODE_BASE_URL || 'http://localhost:4096',
  serverPassword: process.env.OPENCODE_SERVER_PASSWORD,
  modelName: 'anthropic/claude-sonnet-4-5',
});

// OpenCode CLI Provider
import { OpenCodeCliProvider } from '@the-new-fuse/core/llm/providers';

const opencodeCli = new OpenCodeCliProvider({
  cliPath: process.env.OPENCODE_CLI_PATH || 'opencode',
  modelName: 'anthropic/claude-sonnet-4-5',
});
```

**Starting OpenCode Server**:

```bash
# Default server (localhost:4096)
opencode serve

# Custom port
opencode serve --port 4096

# With authentication
OPENCODE_SERVER_PASSWORD=your-password opencode serve

# With CORS for development
opencode serve --cors http://localhost:5173
```

**Key Implementation Details**:

- `OpenCodeApiProvider`: Uses HTTP API for server-based deployments
- `OpenCodeCliProvider`: Spawns the opencode binary locally
- Session management for stateful interactions
- Session management for stateful interactions
- Health check via `/global/health` endpoint

### PicoClaw & Kilo Integration

PicoClaw has native support for Kilo, allowing you to run powerful agents
completely for free using `kilo/auto-free` with explicit fallback options.

**PicoClaw Configuration (`~/.picoclaw/config.json`)**:

```json
{
  "agents": {
    "defaults": {
      "provider": "kilo",
      "model": "kilo/auto-free"
    }
  },
  "providers": {
    "kilo": {
      "api_key": "your-kilo-api-key",
      "api_base": "https://api.kilo.ai/api/gateway"
    }
  }
}
```

**OpenClaw Configuration (`openclaw.json`)**:

```json
{
  "models": {
    "providers": {
      "kilo": {
        "baseUrl": "https://api.kilo.ai/api/gateway/",
        "apiKey": "${KILO_API_KEY}",
        "api": "openai-completions",
        "models": [
          {
            "id": "z-ai/glm-5:free",
            "name": "GLM 5.0 (Free)",
            "contextWindow": 200000,
            "maxTokens": 32000
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "kilo/auto-free"
      }
    }
  }
}
```

**Recommended free fallback set (slug syntax):**

- `minimax/minimax-m2.5:free`
- `moonshotai/kimi-k2.5:free`
- `arcee-ai/trinity-large-preview:free`
- `openrouter/free`
- `stepfun/step-3.5-flash:free`
- `corethink:free`

**CSV form for env/UI fields:**

`minimax/minimax-m2.5:free,moonshotai/kimi-k2.5:free,arcee-ai/trinity-large-preview:free,openrouter/free,stepfun/step-3.5-flash:free,corethink:free`

---

## Quick Start

### 1. Install Dependencies

```bash
# Anthropic SDK
pnpm add @anthropic-ai/sdk

# Google Gemini SDK
pnpm add @google/generative-ai

# OpenAI SDK (if not already installed)
pnpm add openai

# LiteLLM (optional, for proxy)
pip install litellm
```

### 2. Set Environment Variables

Create a [.env](.env) file in the project root:

```bash
# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_MAX_RETRIES=3
ANTHROPIC_TIMEOUT=600000

# Google Gemini
GEMINI_API_KEY=AIzaSyxxxxx
# Alternative variable name
GOOGLE_AI_API_KEY=AIzaSyxxxxx
GEMINI_MODEL=gemini-2.0-flash-exp

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_MODEL=gpt-4o

# LiteLLM Proxy (optional)
LITELLM_API_KEY=sk-xxxxx
LITELLM_BASE_URL=http://localhost:4000

# OpenCode Configuration
# CLI Mode
OPENCODE_CLI_PATH=/usr/local/bin/opencode
OPENCODE_MODEL=anthropic/claude-sonnet-4-5
# API Mode
OPENCODE_BASE_URL=http://localhost:4096
OPENCODE_BASE_URL=http://localhost:4096
OPENCODE_SERVER_PASSWORD=your-secure-password

# Kilo Configuration
KILO_API_KEY=your-kilo-key


# Default provider
DEFAULT_LLM_PROVIDER=anthropic
```

### 3. Run Database Migration

```bash
# Add Anthropic and Gemini provider configs to database
psql -U postgres -d the_new_fuse -f packages/database/migrations/add_anthropic_gemini_llm_configs.sql

# Update API keys
# Option 1: Via SQL
psql -U postgres -d the_new_fuse -c "UPDATE llm_configs SET api_key = 'your-real-key' WHERE provider = 'anthropic';"

# Option 2: Via admin UI (recommended)
# Navigate to /admin/llm-providers and configure API keys
```

### 4. Use the Provider

```typescript
import { AnthropicProvider } from '@the-new-fuse/core/llm/providers';

const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  modelName: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,
  maxTokens: 8192,
});

// Simple generation
const response = await provider.generate('Explain quantum computing');

// Chat with history
const chatResponse = await provider.chat([
  { role: 'system', content: 'You are a helpful coding assistant' },
  { role: 'user', content: 'Write a React component for a todo list' },
]);

// Streaming
for await (const chunk of provider.streamChat([
  { role: 'user', content: 'Count to 10' },
])) {
  process.stdout.write(chunk);
}
```

---

## Configuration

### NestJS Configuration

The [config/llm-provider.config.ts](../config/llm-provider.config.ts) file
provides centralized configuration:

```typescript
export const llmProviderConfig = ConfigModule.forRoot({
  load: [
    () => ({
      providers: {
        anthropic: {
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
          baseURL: process.env.ANTHROPIC_BASE_URL,
          maxRetries: parseInt(process.env.ANTHROPIC_MAX_RETRIES || '3'),
          timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || '600000'),
        },
        gemini: {
          apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
          model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
        },
        opencode: {
          cliPath: process.env.OPENCODE_CLI_PATH,
          baseUrl: process.env.OPENCODE_BASE_URL,
          serverPassword: process.env.OPENCODE_SERVER_PASSWORD,
          model: process.env.OPENCODE_MODEL,
        },
        // ... other providers
      },
      defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'openai',
    }),
  ],
});
```

### Database Configuration

Provider configurations are stored in the `llm_configs` table:

```sql
CREATE TABLE llm_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  api_key VARCHAR(512) NOT NULL, -- Encrypted
  api_endpoint TEXT,
  is_custom BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 10,
  retry_config JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### OAuth Configuration (PicoClaw)

The PicoClaw overseer supports dynamic OAuth providers for authentication:

**Configuration in `apps/picoclaw-overseer/pkg/config/config.go`**:

```go
type ProviderConfig struct {
    ClientID     string   `json:"clientId"`
    ClientSecret string   `json:"clientSecret"`
    Issuer       string   `json:"issuer"`
    Scopes       []string `json:"scopes"`
    AuthPort     int      `json:"authPort"`
}
```

**Supported OAuth Providers**:

| Provider        | Config Fields                          | Description                   |
| --------------- | -------------------------------------- | ----------------------------- |
| Gemini (Google) | ClientID, ClientSecret, Issuer, Scopes | Google OAuth for Gemini API   |
| GitHub Copilot  | ClientID, ClientSecret                 | GitHub OAuth for Copilot      |
| Anthropic       | API Key                                | Direct API key authentication |

**Setting up OAuth**:

1. Update `config.json` with OAuth credentials:

```json
{
  "providers": {
    "gemini": {
      "oauth": {
        "clientId": "your-client-id",
        "clientSecret": "your-client-secret",
        "issuer": "https://accounts.google.com",
        "scopes": [
          "https://www.googleapis.com/auth/generative-language.retriever",
          "https://www.googleapis.com/auth/generative-language.tuning"
        ]
      }
    },
    "github": {
      "oauth": {
        "clientId": "your-github-client-id",
        "clientSecret": "your-github-client-secret"
      }
    }
  }
}
```

2. The generic OAuth flow in `cmd/picoclaw/main.go` handles the authentication
   automatically.

---

## Usage Examples

### Basic Generation

```typescript
import { GeminiProvider } from '@the-new-fuse/core/llm/providers';

const gemini = new GeminiProvider({
  apiKey: process.env.GEMINI_API_KEY!,
  modelName: 'gemini-2.0-flash-exp',
});

const code = await gemini.generate(`
  Write a TypeScript function that implements binary search.
  Include type annotations and JSDoc comments.
`);

console.log(code);
```

### Chat with Context

```typescript
const conversation: LLMMessage[] = [
  { role: 'system', content: 'You are an expert in NestJS' },
  { role: 'user', content: 'How do I create a custom decorator?' },
  { role: 'assistant', content: '...' },
  { role: 'user', content: 'Can you show me an example?' },
];

const response = await provider.chat(conversation, {
  temperature: 0.5,
  maxTokens: 2048,
});

console.log(response.content);
console.log(`Tokens used: ${response.usage?.totalTokens}`);
```

### Streaming Responses

```typescript
const stream = provider.streamChat([
  { role: 'user', content: 'Write a detailed explanation of React hooks' },
]);

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### Multimodal with Gemini

```typescript
import { readFileSync } from 'fs';

const gemini = new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY! });

const imageData = readFileSync('diagram.png').toString('base64');

const response = await gemini.generateMultimodal([
  { text: 'What does this architecture diagram show?' },
  {
    inlineData: {
      mimeType: 'image/png',
      data: imageData,
    },
  },
]);

console.log(response);
```

### Using the LLM Provider Service

```typescript
import { LLMProviderService } from '@the-new-fuse/api';

@Injectable()
export class MyService {
  constructor(private llmService: LLMProviderService) {}

  async processTask() {
    // Get all enabled providers
    const providers = await this.llmService.findAll();

    // Create custom provider
    await this.llmService.create({
      name: 'My Custom Claude',
      provider: 'anthropic',
      modelName: 'claude-3-5-sonnet-20241022',
      apiKey: 'sk-ant-xxxxx',
    });

    // Set default provider
    await this.llmService.setDefault(providerId);
  }
}
```

---

## Cost Optimization

### Cost-Optimized Router

The New Fuse includes an intelligent router that selects the **most
cost-effective provider** for each task:

```typescript
import { CostOptimizedRouter } from '@the-new-fuse/backend/routing';

const router = new CostOptimizedRouter(redis);

const decision = await router.routeTask({
  id: 'task-123',
  type: 'code-generation',
  requiresSkills: ['code-generation', 'typescript'],
  data: {
    /* task data */
  },
  metadata: { budget: 0.2 }, // Max $0.20 per task
});

console.log(`Selected: ${decision.selectedAgent}`);
console.log(`Cost: $${decision.cost}`);
console.log(`Alternatives:`, decision.alternatives);
```

### Cost Models (as of January 2026)

| Provider  | Model       | Cost/Task | Intelligence | Best For               |
| --------- | ----------- | --------- | ------------ | ---------------------- |
| Gemini    | 2.0 Flash   | $0.06     | 3            | **Fastest, cheapest**  |
| Gemini    | 1.5 Flash   | $0.07     | 3            | Balanced               |
| Anthropic | 3.5 Haiku   | $0.08     | 3            | Fast Claude            |
| OpenAI    | GPT-4o-mini | $0.10     | 3            | OpenAI budget          |
| Gemini    | 1.5 Pro     | $0.35     | 4            | 2M context             |
| Anthropic | 3.5 Sonnet  | $0.45     | 4            | **Production default** |
| OpenAI    | GPT-4o      | $0.50     | 4            | OpenAI production      |
| Anthropic | 3 Opus      | $1.80     | 5            | Premium intelligence   |

### Routing Strategy

The router uses a **multi-factor scoring system**:

1. **Capability Match**: Does the agent have required skills?
2. **Intelligence Match**: Prefer exact match, penalize overkill
3. **Budget Fit**: Heavy penalty if over budget
4. **Cost**: Lower is better (10x weight)
5. **Success Rate**: Higher is better (5x weight)
6. **Speed**: Faster is better (0.5x weight)

### Savings Report

```typescript
const savings = await router.getSavingsReport();

console.log(`Actual cost: $${savings.actualCost.toFixed(2)}`);
console.log(`Worst case: $${savings.worstCaseCost.toFixed(2)}`);
console.log(
  `Savings: $${savings.savings.toFixed(2)} (${savings.savingsPercentage.toFixed(1)}%)`
);

// Example output:
// Actual cost: $15.30
// Worst case: $180.00 (if always using Claude Opus)
// Savings: $164.70 (91.5%)
```

---

## Provider-Specific Features

### Anthropic Claude

**Prompt Caching** (reduce costs on repeated prompts):

```typescript
const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  modelName: 'claude-3-5-sonnet-20241022',
});

// Large system prompt will be cached
const messages = [
  { role: 'system', content: largeSystemPrompt }, // Cached after first call
  { role: 'user', content: 'User query 1' },
];

await provider.chat(messages); // Full cost
await provider.chat(messages); // Reduced cost (cached system prompt)
```

**Vision Capabilities**:

```typescript
// All Claude 3+ models support vision
console.log(provider.supportsVision()); // true
console.log(provider.getContextLength()); // 200000
```

### Google Gemini

**Token Counting** (accurate, not approximate):

```typescript
const tokens = await gemini.countTokens('How many tokens is this?');
console.log(`Exact tokens: ${tokens}`);
```

**Grounding with Google Search**:

```typescript
// Gemini can ground responses in real-time Google Search results
console.log(gemini.supportsGrounding()); // true
```

**Massive Context** (2M tokens for Pro):

```typescript
const geminiPro = new GeminiProvider({
  apiKey: process.env.GEMINI_API_KEY!,
  modelName: 'gemini-1.5-pro-latest',
});

console.log(geminiPro.getContextLength()); // 2000000
```

---

## Database Schema

### LLM Configs Table

```sql
-- View all configured providers
SELECT id, name, provider, model_name, enabled, priority
FROM llm_configs
ORDER BY priority ASC;

-- Get default provider
SELECT * FROM llm_configs
WHERE priority = 1;

-- Get enabled providers
SELECT * FROM llm_configs
WHERE enabled = true
ORDER BY priority ASC;
```

### Updating API Keys

```sql
-- Update Anthropic API key
UPDATE llm_configs
SET api_key = 'sk-ant-xxxxx',
    updated_at = NOW()
WHERE provider = 'anthropic' AND model_name = 'claude-3-5-sonnet-20241022';

-- Update Gemini API key
UPDATE llm_configs
SET api_key = 'AIzaSyxxxxx',
    updated_at = NOW()
WHERE provider = 'gemini' AND model_name = 'gemini-2.0-flash-exp';
```

---

## API Reference

### LLMProvider Abstract Class

```typescript
abstract class LLMProvider {
  // Generate completion from simple prompt
  abstract generate(prompt: string): Promise<string>;

  // Chat with message history
  abstract chat(
    messages: LLMMessage[],
    config?: Partial<LLMConfig>
  ): Promise<LLMResponse>;

  // Stream chat completion
  abstract streamChat(
    messages: LLMMessage[],
    config?: Partial<LLMConfig>
  ): AsyncGenerator<string>;

  // Count tokens (provider-specific)
  abstract countTokens(text: string): Promise<number>;

  // Get context window size
  abstract getContextLength(): number;
}
```

### LLMMessage Interface

```typescript
interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}
```

### LLMResponse Interface

```typescript
interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, unknown>;
}
```

### LLMConfig Interface

```typescript
interface LLMConfig {
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  apiKey?: string;
}
```

---

## Troubleshooting

### Common Issues

**1. API Key Not Found**

```
Error: Missing API key for provider 'anthropic'
```

**Solution**: Set environment variable or update database:

```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx
```

**2. Provider Not Enabled**

```
Error: Provider 'anthropic' is disabled
```

**Solution**: Enable in database:

```sql
UPDATE llm_configs SET enabled = true WHERE provider = 'anthropic';
```

**3. Budget Exceeded**

```
Error: All capable agents over budget ($0.50)
```

**Solution**: Increase budget or use cheaper provider:

```typescript
const decision = await router.routeTask({
  // ...
  metadata: { budget: 1.0 }, // Increase budget
});
```

**4. Rate Limiting**

```
Error: Rate limit exceeded for provider 'anthropic'
```

**Solution**: Implement retry with backoff (already configured):

```typescript
const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  maxRetries: 5, // Increase retries
  timeout: 900000, // Increase timeout (15 min)
});
```

### Debug Mode

Enable detailed logging:

```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('LLMProvider');
logger.setLogLevels(['log', 'error', 'warn', 'debug', 'verbose']);
```

### Health Checks

```typescript
// Check if provider is working
try {
  const response = await provider.generate('Hello');
  console.log('✅ Provider healthy:', response);
} catch (error) {
  console.error('❌ Provider unhealthy:', error);
}
```

---

## Best Practices

### 1. Use Cost-Optimized Routing

Always route through CostOptimizedRouter instead of hardcoding provider
selection:

```typescript
// ❌ Bad: Hardcoded to expensive model
const provider = new AnthropicProvider({ model: 'claude-3-opus' });

// ✅ Good: Let router choose based on task
const decision = await router.routeTask(task);
```

### 2. Set Budgets

Always specify a budget to prevent unexpected costs:

```typescript
const task = {
  type: 'code-review',
  metadata: { budget: 0.5 }, // Max $0.50
};
```

### 3. Use Streaming for UX

Stream responses for better user experience:

```typescript
for await (const chunk of provider.streamChat(messages)) {
  sendToClient(chunk); // Real-time updates
}
```

### 4. Implement Fallbacks

```typescript
const providers = [
  new AnthropicProvider({
    /* ... */
  }),
  new GeminiProvider({
    /* ... */
  }),
  new OpenAIProvider({
    /* ... */
  }),
];

for (const provider of providers) {
  try {
    return await provider.chat(messages);
  } catch (error) {
    console.warn(`Provider failed, trying next:`, error);
  }
}

throw new Error('All providers failed');
```

### 5. Monitor Costs

```typescript
const stats = await router.getRoutingStats();
console.log(`Total tasks: ${stats.totalRoutings}`);
console.log(`Average cost: $${stats.averageCost.toFixed(4)}`);
console.log(`Agent usage:`, stats.agentUsage);
```

---

## Environment Variables Reference

| Variable                   | Required | Default                       | Description            |
| -------------------------- | -------- | ----------------------------- | ---------------------- |
| `ANTHROPIC_API_KEY`        | Yes\*    | -                             | Anthropic API key      |
| `ANTHROPIC_MODEL`          | No       | `claude-3-5-sonnet-20241022`  | Default Claude model   |
| `ANTHROPIC_BASE_URL`       | No       | -                             | Custom API endpoint    |
| `ANTHROPIC_MAX_RETRIES`    | No       | `3`                           | Max retry attempts     |
| `ANTHROPIC_TIMEOUT`        | No       | `600000`                      | Timeout in ms          |
| `GEMINI_API_KEY`           | Yes\*    | -                             | Google AI API key      |
| `GOOGLE_AI_API_KEY`        | Yes\*    | -                             | Alternative var name   |
| `GEMINI_MODEL`             | No       | `gemini-2.0-flash-exp`        | Default Gemini model   |
| `LITELLM_BASE_URL`         | No       | `http://localhost:4000`       | LiteLLM proxy URL      |
| `OPENCODE_CLI_PATH`        | No       | `opencode`                    | Path to CLI binary     |
| `OPENCODE_BASE_URL`        | No       | `http://localhost:4096`       | API Server URL         |
| `OPENCODE_SERVER_PASSWORD` | No       | -                             | API Server Password    |
| `OPENCODE_MODEL`           | No       | `anthropic/claude-sonnet-4-5` | Default OpenCode model |
| `KILO_API_KEY`             | No       | -                             | Kilo API key           |
| `DEFAULT_LLM_PROVIDER`     | No       | `openai`                      | Default provider       |

\* At least one provider's API key is required

---

## Next Steps

1. **Get API Keys**:
   - [Anthropic Console](https://console.anthropic.com/)
   - [Google AI Studio](https://makersuite.google.com/app/apikey)

2. **Configure Providers**:
   - Set environment variables
   - Run database migration
   - Update API keys via admin UI

3. **Test Integration**:

   ```bash
   pnpm run test:llm-providers
   ```

4. **Monitor Usage**:
   - Set up cost tracking
   - Review routing decisions
   - Optimize budget allocation

---

**The New Fuse LLM Provider Integration** **Version**: 1.0 **Last Updated**:
January 17, 2026
