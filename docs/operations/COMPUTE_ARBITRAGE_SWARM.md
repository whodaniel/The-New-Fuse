# Compute Arbitrage Swarm Design

## Mission

Ensure TNF agents are ALWAYS connected to inference by continuously harvesting
free/cheap compute resources.

## Core Insight

**TNF Chrome Extension federation = Zero token cost research**

- Pre-written prompts → External AI → Automatic file return via federated relay
- No LLM tokens consumed on our side
- Force multiplier for compute resources

## Scout Agent Types

### 1. Resource Scouts (Every 6 hours)

**Goal**: Find free/cheap compute options

**Targets**:

- Lambda Labs (GPU rentals, free credits)
- RunPod (serverless GPU)
- Together.ai (free tier)
- Replicate (pay-per-second)
- Hugging Face (free inference API)
- Cloudflare Workers AI (free tier)
- Modal (serverless, free credits)
- Banana (serverless GPU)

**Method**:

- Use TNF Chrome Extension to prompt Perplexity Pro: "What are the latest free
  GPU credits available for [provider]?"
- Use Google AI Mode: "Free tier limits for [provider] inference API 2024"
- Return results to `swarm-resources/YYYY-MM-DD.md`

### 2. News Scouts (Every 4 hours)

**Goal**: AI-related news → Blog content → TNF utility analysis

**Targets**:

- New model releases (OpenAI, Anthropic, Google, Meta)
- Pricing changes
- API updates
- Framework releases (LangChain, LlamaIndex, etc.)
- Security vulnerabilities in AI systems

**Method**:

- Use Perplexity Pro: "AI model news [date]"
- Use Google AI Mode: "What AI models were released this week?"
- Return results to `swarm-news/YYYY-MM-DD.md`

### 3. Model Scouts (Daily)

**Goal**: Track new models, pricing, free tiers

**Track**:

- OpenAI: GPT-5, pricing changes
- Anthropic: Claude updates
- Google: Gemini releases
- Meta: Llama releases
- Mistral: New models
- DeepSeek: Pricing/free tier
- MiniMax: API availability
- GLM: ZhipuAI releases

**Method**:

- Perplexity Pro: "Latest AI model releases [month year]"
- Return to `swarm-models/registry.md`

### 4. Integration Scouts (Weekly)

**Goal**: Find APIs, SDKs, tools for TNF enhancement

**Look for**:

- Vector databases (Pinecone free tier, Qdrant cloud)
- Embedding APIs (Cohere free tier)
- Agent frameworks (AutoGen, CrewAI updates)
- Browser automation (Puppeteer, Playwright updates)
- Memory systems (Mem0, Letta)

## Implementation Architecture

### Layer 1: Cron Scheduling

```json
{
  "scout-resource": "0 */6 * * *",
  "scout-news": "0 */4 * * *",
  "scout-model": "0 9 * * *",
  "scout-integration": "0 10 * * 1"
}
```

### Layer 2: TNF Chrome Extension Federation

```
[Scout Prompt] → [Chrome Extension] → [External AI] → [Relay] → [File]
     ↓                                              ↓
[Pre-written template]                    [Automatic file return]
```

### Layer 3: Result Processing

- Files land in `swarm-{type}/YYYY-MM-DD.md`
- Daily consolidation into `swarm-digest/daily.md`
- Weekly summary into `swarm-digest/weekly.md`
- Critical findings → `MEMORY.md`

### Layer 4: Action Triggers

When scout finds:

- **Free credits** → Immediate signup attempt (manual, with notification)
- **New free model** → Add to TNF config
- **Security vulnerability** → Alert + patch workflow
- **Pricing drop** → Update cost calculations

## Resource Inventory (Current)

### Active (Free Tier)

- **Kilo/MiniMax M2.5**: 200K context, free
- **Kilo/GLM 5.0**: 200K context, free
- **Google AI Mode**: Free via search
- **AI Sidebar**: Gemini 3.0 Flash, free
- **Perplexity Pro**: Paid (1 year available)

### Potential (To Scout)

- Hugging Face Inference API
- Together.ai free tier
- Cloudflare Workers AI
- Modal free credits
- RunPod serverless

## Swarm State Tracking

All scout activity tracked in Cloudflare D1:

- `swarm_runs`: Scout execution history
- `swarm_findings`: Discovered resources
- `swarm_actions`: Triggered actions

## Next Steps

1. Create cron jobs for scout schedules
2. Build pre-written prompt templates
3. Set up result file structure
4. Configure Cloudflare D1 tables
5. Wire heartbeat integration for lightweight checks
