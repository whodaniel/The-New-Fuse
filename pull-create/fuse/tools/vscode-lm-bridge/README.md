# VS Code Language Model Bridge

OpenAI-compatible API bridge for VS Code's Language Model API (Copilot).

## Overview

This server provides an OpenAI-compatible REST API endpoint that bridges to VS Code's built-in Language Model API. It allows any OpenAI-compatible client to use VS Code Copilot models without modifications.

### Key Features

- **OpenAI-Compatible API**: Drop-in replacement for OpenAI API endpoints
- **Dynamic Model Discovery**: Automatically discovers available VS Code Copilot models
- **WebSocket Integration**: Real-time communication with VS Code extension
- **Streaming Support**: Full support for streaming responses
- **Multiple Model Support**: GPT-4, GPT-3.5, Claude, Gemini, and more
- **Zero Configuration**: Works out of the box with sensible defaults
- **Health Monitoring**: Built-in health check endpoint

## Installation

### Global Installation

```bash
npm install -g vscode-lm-bridge
```

### Local Installation

```bash
cd tools/vscode-lm-bridge
npm install
```

## Usage

### Starting the Server

```bash
# Using npm
npm start

# Using the binary
vscode-lm-bridge

# With custom port
PORT=3000 vscode-lm-bridge
```

The server will start on `http://localhost:8080` by default.

### API Endpoints

#### Chat Completions (OpenAI-compatible)

```bash
POST /v1/chat/completions
```

**Request:**

```json
{
  "model": "gpt-4o",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 4096,
  "stream": false
}
```

**Response:**

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4o",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you today?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

#### List Models

```bash
GET /v1/models
```

**Response:**

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4o",
      "object": "model",
      "created": 1234567890,
      "owned_by": "vscode-copilot",
      "family": "gpt-4",
      "vendor": "openai",
      "maxInputTokens": 8192,
      "capabilities": {"chat": true, "streaming": true}
    }
  ]
}
```

#### Get Model Details

```bash
GET /v1/models/:modelId
```

#### Health Check

```bash
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T09:00:00.000Z",
  "vsCodeConnected": true,
  "modelsLoaded": 6,
  "availableModels": [
    {"id": "gpt-4o", "vendor": "openai"},
    {"id": "claude-3-5-sonnet", "vendor": "anthropic"}
  ]
}
```

## Available Models

The bridge supports all VS Code Copilot models and includes fallback models:

### OpenAI Models
- `gpt-4o` - GPT-4 Optimized (8K context)
- `gpt-4` - GPT-4 (8K context)
- `gpt-3.5-turbo` - GPT-3.5 Turbo (4K context)

### Anthropic Models
- `claude-3-5-sonnet` - Claude 3.5 Sonnet (8K context)
- `claude-3-haiku` - Claude 3 Haiku (8K context)

### Google Models
- `gemini-1.5-pro` - Gemini 1.5 Pro (8K context)

## VS Code Extension Integration

The bridge communicates with a VS Code extension via WebSocket for real-time model updates and request proxying.

### WebSocket Protocol

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8080');
```

**Message Types:**

1. **Get Models Request:**
```json
{
  "type": "get_models",
  "requestId": "uuid"
}
```

2. **Models Response:**
```json
{
  "type": "models_response",
  "requestId": "uuid",
  "models": [...]
}
```

3. **Chat Request:**
```json
{
  "type": "chat_request",
  "requestId": "uuid",
  "messages": [...],
  "model": "gpt-4o",
  "options": {"temperature": 0.7}
}
```

4. **Chat Response:**
```json
{
  "type": "response",
  "requestId": "uuid",
  "content": "Response text"
}
```

## Configuration

### Environment Variables

- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (development/production)

### Programmatic Usage

```javascript
const app = require('vscode-lm-bridge');

// App is an Express instance
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Use Cases

### 1. Use with Continue.dev

```json
{
  "models": [{
    "title": "VS Code Copilot",
    "provider": "openai",
    "model": "gpt-4o",
    "apiBase": "http://localhost:8080/v1",
    "apiKey": "vscode-lm-bridge-token"
  }]
}
```

### 2. Use with Custom Scripts

```python
import openai

openai.api_base = "http://localhost:8080/v1"
openai.api_key = "vscode-lm-bridge-token"

response = openai.ChatCompletion.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### 3. Use with LangChain

```typescript
import { ChatOpenAI } from "langchain/chat_models/openai";

const chat = new ChatOpenAI({
  modelName: "gpt-4o",
  openAIApiKey: "vscode-lm-bridge-token",
  configuration: {
    basePath: "http://localhost:8080/v1"
  }
});
```

## Streaming Responses

Enable streaming for real-time response generation:

```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Authorization: Bearer vscode-lm-bridge-token" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Tell me a story"}],
    "stream": true
  }'
```

Response will be Server-Sent Events (SSE):

```
data: {"id":"chatcmpl-123","choices":[{"delta":{"role":"assistant","content":"Once"}}]}

data: {"id":"chatcmpl-123","choices":[{"delta":{"content":" upon"}}]}

data: [DONE]
```

## Development

### Running in Development Mode

```bash
npm run dev
```

Uses `nodemon` for auto-reloading on file changes.

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint        # Check for issues
npm run lint:fix    # Fix issues automatically
```

### Formatting

```bash
npm run format       # Format code
npm run format:check # Check formatting
```

## Architecture

```
┌─────────────────┐
│  OpenAI Client  │
│  (any library)  │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────────┐
│  VS Code LM Bridge  │
│   (Express Server)  │
└────────┬────────────┘
         │ WebSocket
         ▼
┌─────────────────────┐
│  VS Code Extension  │
│  (Language Model)   │
└─────────────────────┘
```

## Error Handling

The bridge handles errors gracefully:

- **401 Unauthorized**: Missing or invalid API key
- **400 Bad Request**: Invalid request format
- **404 Not Found**: Model not found
- **500 Internal Server Error**: Server-side error
- **Timeout**: 30-second timeout for chat requests

## Security Considerations

1. **API Key Validation**: All requests require an API key
2. **CORS Enabled**: Allows cross-origin requests
3. **Input Validation**: Validates all request payloads
4. **Timeout Protection**: Prevents long-running requests

## Limitations

1. **VS Code Dependency**: Requires VS Code Copilot for real model access
2. **Fallback Mode**: Works in simulation mode without VS Code connection
3. **Single WebSocket**: Only one VS Code extension can connect at a time
4. **No Authentication**: API keys are not validated (accept-all mode)

## Troubleshooting

### Server Won't Start

**Problem:** Port already in use

**Solution:**
```bash
PORT=3000 vscode-lm-bridge
```

### Models Not Loading

**Problem:** VS Code extension not connected

**Solution:**
1. Check `/health` endpoint
2. Verify WebSocket connection
3. Fallback models will be used automatically

### Requests Timing Out

**Problem:** VS Code not responding

**Solution:**
1. Verify VS Code Language Model API is enabled
2. Check VS Code extension logs
3. Increase timeout in `callVSCodeLanguageModel()`

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT

## Related Projects

- [VS Code Language Model API](https://code.visualstudio.com/api/extension-guides/language-model)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Continue.dev](https://continue.dev)

## Support

- Issues: [GitHub Issues](https://github.com/your-repo/issues)
- Documentation: [Full Docs](https://your-docs-site.com)
- Community: [Discord](https://discord.gg/your-server)

---

Made with ❤️ for the VS Code community
