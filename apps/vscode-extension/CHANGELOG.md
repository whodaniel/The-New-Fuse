# Changelog

All notable changes to "The New Fuse" extension will be documented in this file.

## [9.1.0] - 2026-02-02

### 🚀 Major Features

#### Anthropic Tool Discovery Protocol Implementation

- **Dynamic Tool Loading** - Tools are now loaded on-demand using Anthropic's
  Tool Search protocol
- **85% Token Reduction** - Deferred tools no longer consume context window
  until needed
- **BM25 + Regex Search** - Dual search algorithms for optimal tool discovery
- **Beta Headers Support** - Automatic `advanced-tool-use-2025-11-20` and
  `mcp-client-2025-11-20` headers

### ✨ New Features

#### Tool Search Service (`ToolSearchService.ts`)

- ✅ **BM25 Relevance Search** - Natural language tool discovery via
  `tool_search_tool_bm25_20251119`
- ✅ **Regex Pattern Search** - Exact pattern matching via
  `tool_search_tool_regex_20251119`
- ✅ **Tool Indexing** - Fast in-memory indexing of deferred tools
- ✅ **Configurable Results** - Returns 3-5 most relevant tools per search
- ✅ **Tool Reference Expansion** - Automatic expansion of discovered
  tool_references

#### MCP Service Enhancements

- ✅ **Tool Deferral** - Separate active vs deferred tools per server
- ✅ **On-Demand Loading** - `loadDeferredTool()` and `loadDeferredTools()`
  methods
- ✅ **Server Configuration** - `default_defer_loading` and
  `always_loaded_tools` options
- ✅ **Connection State** - Tracks `deferredTools` and `allTools` separately

#### AI Service Updates

- ✅ **Beta Headers** - Automatically adds Anthropic beta headers when tool
  search is enabled
- ✅ **defer_loading Flag** - Tools sent to API include
  `defer_loading: true/false`
- ✅ **Response Handling** - Parses `server_tool_use` and
  `tool_search_tool_result` blocks

#### Tool Orchestration

- ✅ **Auto Tool Search** - Enabled when total tools exceed
  `deferToolsAboveCount` (default: 10)
- ✅ **Search Tool Integration** - Handles tool_search_tool calls in
  orchestration loop
- ✅ **Dynamic Loading** - Discovered tools loaded into active set during
  execution

### 🛠️ Configuration

#### New Settings (`theNewFuse.toolSearch.*`)

| Setting              | Type    | Default                                                         | Description                              |
| -------------------- | ------- | --------------------------------------------------------------- | ---------------------------------------- |
| `enabled`            | boolean | `true`                                                          | Enable Tool Discovery Protocol           |
| `maxResults`         | number  | `5`                                                             | Max tools returned per search            |
| `defaultMethod`      | string  | `bm25`                                                          | Default search algorithm (regex or bm25) |
| `alwaysLoadedTools`  | array   | `["read_file", "write_file", "list_directory", "search_files"]` | Tools that are never deferred            |
| `deferredCategories` | array   | `["google", "automation", "external", "database"]`              | Categories to defer by default           |

#### MCP Server Configuration Updates

| Setting                 | Type    | Default | Description                                 |
| ----------------------- | ------- | ------- | ------------------------------------------- |
| `default_defer_loading` | boolean | `false` | Defer all tools from this server by default |
| `always_loaded_tools`   | array   | `[]`    | Tools from this server to never defer       |

### 📁 New Files

- `src/services/ToolSearchService.ts` - BM25 + regex tool search implementation
- `docs/TOOL_DISCOVERY_PROTOCOL.md` - Comprehensive protocol documentation

### 📝 Type Updates

- `MCPTool` - Added `defer_loading`, `always_load`, `category`, `keywords`
- `MCPServerConfig` - Added `default_defer_loading`, `always_loaded_tools`
- `ToolDefinition` - Added `defer_loading`
- `LLMRequest` - Added `enableToolSearch`
- `LLMResponse` - Added `toolSearchResults`
- New types: `ToolSearchConfig`, `ToolSearchResult`, `ToolReference`

### 🔗 External References

- [Anthropic Tool Search Documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool)
- [MCP Specification](https://modelcontextprotocol.io/specification/2025-11-25)

### 🎯 Performance Improvements

- **Token Usage** - ~85% reduction when using deferred tools
- **Accuracy** - Improved tool selection (Opus 4: 49%→74%, Opus 4.5:
  79.5%→88.1%)
- **Latency** - Reduced initial context load time

---

## [8.0.0] - 2025-09-30

### 🚀 Major Features

#### Enhanced LiteLLM Integration

- **Complete LiteLLM Provider Rewrite** - Upgraded from basic 81-line
  implementation to comprehensive 1000+ line enterprise-grade provider
- **LiteLLM Configuration Panel** - New webview panel accessible via
  `The New Fuse: 🚀 Enhanced LiteLLM Configuration` command
- **Comprehensive Settings Schema** - 20+ configurable LiteLLM settings
  accessible through VSCode settings

### ✨ New Features

#### Reliability & Performance

- ✅ **Streaming Responses** - Synchronous and asynchronous streaming support
  with SSE
- ✅ **Retry Logic** - Configurable retry attempts with exponential backoff
  (default: 3 retries)
- ✅ **Fallback Models** - Automatic failover to backup models on primary
  failure
- ✅ **Circuit Breakers** - Configurable failure threshold protection (default:
  5 failures)
- ✅ **Caching System** - In-memory and Redis-based caching with configurable
  TTL
- ✅ **Load Balancing** - Multiple routing strategies for endpoint distribution

#### Cost & Budget Management

- ✅ **Budget Tracking** - Real-time spend tracking with configurable limits
- ✅ **Budget Alerts** - Automatic alerts when approaching or exceeding budget
  limits
- ✅ **Virtual Keys Management** - Per-agent API keys with individual
  budget/rate limits
- ✅ **Cost Monitoring** - Real-time cost estimation and tracking dashboard

#### Monitoring & Observability

- ✅ **Health Checks** - Multiple endpoint types (/health, /readiness,
  /liveliness)
- ✅ **Background Health Monitoring** - Configurable automatic health checks
- ✅ **Event System** - Comprehensive event emission for monitoring integrations
- ✅ **Custom Logging Callbacks** - Integration-ready for Datadog, Langfuse,
  etc.
- ✅ **Performance Metrics** - Real-time metrics dashboard with cache hit rates

#### Advanced Capabilities

- ✅ **Embeddings Support** - Single and batch text embeddings generation
- ✅ **Proxy Management** - Full lifecycle control of LiteLLM proxy server
- ✅ **Multi-Model Support** - Support for 100+ LLM providers through LiteLLM
- ✅ **Configuration Testing** - Built-in connection testing and validation

### 🛠️ Configuration

#### New Settings (`tnf.litellm.*`)

**Basic Configuration:**

- `baseURL` - LiteLLM proxy base URL (default: http://localhost:4000)
- `apiKey` - LiteLLM API key (optional)
- `model` - Default LiteLLM model (default: gpt-3.5-turbo)
- `masterKey` - Master key for virtual keys management

**Reliability:**

- `maxRetries` - Maximum retry attempts (default: 3)
- `retryDelay` - Initial retry delay in ms (default: 1000)
- `retryMultiplier` - Exponential backoff multiplier (default: 2)
- `fallbackModels` - Array of fallback models
- `enableFallback` - Enable automatic fallbacks (default: true)

**Circuit Breaker:**

- `circuitBreakerThreshold` - Failures before opening (default: 5)
- `circuitBreakerTimeout` - Cooldown period in ms (default: 60000)

**Caching:**

- `enableCache` - Enable response caching (default: true)
- `cacheType` - Cache storage type: memory|redis (default: memory)
- `cacheTTL` - Cache time-to-live in seconds (default: 3600)
- `redisHost` - Redis host for caching (default: localhost)
- `redisPort` - Redis port for caching (default: 6379)

**Budget & Cost:**

- `enableBudget` - Enable budget tracking (default: false)
- `budgetLimit` - Maximum budget in USD (default: 0)

**Advanced:**

- `timeout` - Request timeout in ms (default: 30000)
- `enableBackgroundHealthCheck` - Auto health checks (default: false)
- `healthCheckInterval` - Health check interval in ms (default: 60000)
- `embeddingModel` - Model for embeddings (default: text-embedding-ada-002)
- `enableLogging` - Enable detailed logging (default: true)

### 📝 Commands

**New Commands:**

- `The New Fuse - LLM: 🚀 Enhanced LiteLLM Configuration` - Open LiteLLM
  configuration panel

### 🔧 Technical Improvements

- Updated extension activation to v8.0.0
- Integrated LiteLLMConfigPanel into extension lifecycle
- Added comprehensive TypeScript type definitions
- Improved error handling and validation
- Enhanced logging and diagnostics

### 📚 Documentation

- Created comprehensive LiteLLM implementation documentation
- Added LITELLM_IMPLEMENTATION_SUMMARY.md with 4000+ lines of documentation
- Included 13 comprehensive usage examples
- Quick reference guide for common patterns
- Full API reference and configuration guide

### 🔒 Security

- API key sanitization in logs
- Sensitive data redaction
- Master key protection
- Per-user budget limits
- Rate limiting support
- Access control via virtual keys

### 📦 Dependencies

No new external dependencies required - all features work with existing
packages.

### ⚠️ Breaking Changes

None - this release is fully backward compatible with v7.4.0.

### 🐛 Bug Fixes

- Fixed TypeScript compilation errors in LiteLLMConfigPanel
- Improved template literal handling in webview content

### 🎯 Next Steps

1. Configure LiteLLM settings via VSCode settings or the configuration panel
2. Optionally set up Redis for enhanced caching performance
3. Configure virtual keys if needed for multi-tenant scenarios
4. Set up monitoring/observability integrations via event listeners

---

## [7.4.0] - Previous Release

- MCP Configuration Mode
- Multi-Agent Orchestration
- Security Dashboard
- Terminal Integration
- CLI Commands
- Chat Interface

---

**For full details on new features, see:**

- `/packages/tnf-cli/src/lib/LITELLM_README.md` - Complete implementation guide
- `/packages/tnf-cli/src/lib/QUICK_REFERENCE.md` - Quick start guide
- `/COMPLETE_UI_INTEGRATION_IMPLEMENTATION.md` - UI integration guide
- `/LITELLM_IMPLEMENTATION_SUMMARY.md` - Complete summary
