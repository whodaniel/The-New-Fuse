# Kilo Code Auth Plugin

Kilo Code free tier provider with automatic context injection for The New Fuse.

## Key Features

### Codebase Context Gathering

- Reads `package.json` for project information
- Reads `.kilocoderules` for project-specific rules
- Generates directory structure (up to 3 levels deep)
- Reads key documentation files (README.md, docs/README.md, etc.)
- Caches context for performance

### OpenClaw Protocol Context Gathering

- Reads `docs/architecture/OPENCLAW_PROTOCOL_DEEP_DIVE.md`
- Reads `docs/integrations/KILOCODE_INTEGRATION.md`
- Includes key OpenClaw concepts summary
- Caches context for performance

### Context Injection

- Automatically injects both codebase and OpenClaw context into the system
  prompt
- Preserves original system message if present
- Adds clear instructions for using the context
- Context is added before each API call

### Proxy Server

- Runs on port 18790 (updated to avoid gateway conflict)
- Handles `/v1/chat/completions` requests
- Strips Authorization headers (required for free tier)
- Cleans messages for free tier compatibility
- Handles `reasoning_content` field conversion
- Implements fake streaming for OpenClaw compatibility

## Installation

### 1. Copy Plugin to OpenClaw Extensions

```bash
# Copy the plugin directory to OpenClaw extensions
cp -r openclaw-runtime/extensions/kilocode-auth ~/.openclaw/extensions/
```

### 2. Configure OpenClaw

Add the following to your `~/.openclaw/openclaw.json`:

```json
{
  "models": {
    "providers": {
      "kilocode": {
        "baseUrl": "http://localhost:18790/v1",
        "apiKey": "none",
        "api": "openai-completions",
        "authHeader": false,
        "models": [
          {
            "id": "glm-4.7-free",
            "name": "GLM-4.7 (Free)",
            "reasoning": true,
            "contextWindow": 128000,
            "maxTokens": 8192
          },
          {
            "id": "minimax-m2.1-free",
            "name": "MiniMax-M2.1 (Free)",
            "reasoning": true,
            "contextWindow": 128000,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "kilocode/glm-4.7-free"
      }
    }
  }
}
```

## How It Works

1. When a chat request comes in, the plugin:
   - Gathers codebase context (project info, rules, structure, docs)
   - Gathers OpenClaw protocol context (documentation, concepts)
   - Injects both into the system prompt
   - Cleans messages for free tier compatibility
   - Forwards to Kilo Code API
   - Returns response with proper formatting

2. The AI now has full awareness of:
   - Your project structure and files
   - Project rules and conventions
   - OpenClaw protocol details

## Troubleshooting

### Port Already in Use

If you see "Port 18790 already in use", the proxy is already running. This is
normal and expected.

### API Errors

If you see API errors, check that the Kilo Code free tier API is accessible and
the proxy server is running.
