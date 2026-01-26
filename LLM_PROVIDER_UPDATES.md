# LLM Provider & API Key Configuration Update

## Summary of Changes

We have expanded the platform's support for major LLM providers in both the
Settings UI and Agent Creator.

### 1. API Key Management

**Location:** `Settings > API Keys` **Updates:**

- Added support for **Groq** (Ultra-fast inference)
- Added support for **Perplexity** (Online search & reasoning)
- Added support for **OpenRouter** (Unified API gateway)
- Existing support retained for: OpenAI, Anthropic, Google Gemini, Cohere,
  Mistral, Supabase.

### 2. Agent Creation

**Location:** `Agents > New Agent` **Updates:**

- Updated `LLMSelector` to include default models for all supported providers.
- Users can now explicitly select which model powers their agent (e.g.,
  `Llama 3 70B` via Groq, `Command R+` via Cohere).
- Custom provider support remains available for self-hosted or other endpoints.

## Supported Providers Map

| Provider       | Default Models            | API Key ID   |
| :------------- | :------------------------ | :----------- |
| **OpenAI**     | GPT-4, GPT-3.5 Turbo      | `openai`     |
| **Anthropic**  | Claude 3 Opus, Sonnet     | `anthropic`  |
| **Google**     | Gemini 1.5 Pro            | `google`     |
| **Groq**       | Llama 3 70B, Mixtral 8x7b | `groq`       |
| **Perplexity** | Sonar Medium Online       | `perplexity` |
| **Mistral**    | Mistral Large             | `mistral`    |
| **Cohere**     | Command R+                | `cohere`     |
| **OpenRouter** | Auto / Any                | `openrouter` |

## Next Steps for User

1. Navigate to **Settings > API Keys**.
2. Enter your API keys for the services you wish to use.
3. Go to **Agents > Create Agent** and select your preferred model from the
   dropdown.
