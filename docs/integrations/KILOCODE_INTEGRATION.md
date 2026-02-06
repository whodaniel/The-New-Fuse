# Kilo Code Integration with OpenClaw

## Summary

This document records the integration of Kilo Code's free AI models
(GLM-4.7-free and MiniMax-M2.1-free) with the OpenClaw agent framework.

## Problem Statement

The user wanted to use Kilo Code's free tier models with OpenClaw. The main
challenges were:

1. **Authentication Issues**: OpenCode's free tier API returns
   `HTTP 401: Invalid API key` when any Authorization header is present
2. **Response Format Mismatch**: The free tier returns a `reasoning_content`
   field that OpenClaw doesn't natively handle
3. **Streaming Expectations**: OpenClaw expects streaming responses, but the
   free tier works better with non-streaming calls

## Solution Overview

Created a custom OpenClaw plugin (`kilocode-auth`) that:

1. Registers a local proxy endpoint at `/v1/chat/completions` on port 18789
2. Strips Authorization headers before forwarding requests to OpenCode
3. Transforms and truncates messages for free tier compatibility
4. Converts `reasoning_content` to `<think>` tags in the response
5. Implements fake-streaming to satisfy OpenClaw's client expectations

## Files Modified/Created

### Created Files

| File                                             | Purpose                               |
| ------------------------------------------------ | ------------------------------------- |
| `~/.openclaw/extensions/kilocode-auth/index.ts`  | Main plugin with proxy implementation |
| `~/.openclaw/extensions/kilocode-auth/README.md` | Plugin documentation                  |

### Modified Files

| File                        | Changes                                                       |
| --------------------------- | ------------------------------------------------------------- |
| `~/.openclaw/openclaw.json` | Added `kilocode` provider configuration, set as primary model |

## Configuration Changes

### openclaw.json

Added the following provider configuration:

```json
"kilocode": {
  "baseUrl": "http://localhost:18789/v1",
  "apiKey": "none",
  "api": "openai-completions",
  "headers": {},
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
```

Set primary model to:

```json
"model": {
  "primary": "kilocode/glm-4.7-free"
}
```

## Technical Details

### Proxy Logic (index.ts)

The proxy performs these transformations:

1. **Message Cleaning**:
   - Converts multi-part content arrays to plain strings
   - Maps `tool` role to `user` (free tier doesn't support tool role)
   - Filters out empty messages

2. **History Truncation**:
   - Keeps system message
   - Limits user/assistant history to last 18 turns

3. **Model ID Transformation**:
   - Strips provider prefix (e.g., `kilocode/glm-4.7-free` → `glm-4.7-free`)

4. **Response Normalization**:
   - Merges `reasoning_content` into `content` with `<think>` tags
   - Ensures OpenAI-compatible response structure

5. **Fake Streaming**:
   - If client requests streaming, wraps response in SSE format
   - Sends single chunk with full content, then `[DONE]`

### Error Handling

The proxy logs all errors and forwards appropriate HTTP status codes:

- 500 errors from OpenCode are logged with full response body
- Proxy exceptions are caught and returned as JSON error responses

## Testing Results

### Test 1: Simple Query

```bash
npm start -- agent --local --to +5000 --message "Who are you? Respond in 5 words."
```

**Result**: ✅ "I am an AI assistant."

### Test 2: Complex Query with Reasoning

```bash
npm start -- agent --local --to +5000 --message "What is the capital of France? Explain your reasoning." --thinking high
```

**Result**: ✅ Full response with multi-point reasoning explanation

## Troubleshooting Encountered

### Issue 1: "HTTP 500: Cannot read properties of undefined (reading 'prompt_tokens')"

**Cause**: Messages in the history contained complex structures (tool results,
multi-part content) that the free tier couldn't process.

**Solution**: Added aggressive message cleaning and history truncation in the
proxy.

### Issue 2: "No reply from agent"

**Cause**: Response from proxy wasn't in the format OpenClaw expected.

**Solution**: Implemented fake-streaming and ensured response JSON structure
matches OpenAI spec exactly.

### Issue 3: Model name mismatch

**Cause**: OpenClaw was sending `kilocode/glm-4.7-free` but OpenCode expects
just `glm-4.7-free`.

**Solution**: Added provider prefix stripping in the proxy.

## Dependencies

- OpenClaw runtime (v2026.2.2+)
- Node.js 24+
- OpenCode Zen API access (free tier, no account required)

## Future Improvements

1. **Real Streaming**: Implement actual streaming if OpenCode adds support
2. **Tool Calling**: Add tool call support if free tier enables it
3. **Image Support**: Add image handling when available
4. **Rate Limiting**: Add client-side rate limiting to avoid API bans

## Date

- **Integration Started**: 2026-02-04
- **Integration Completed**: 2026-02-04
- **Documentation Created**: 2026-02-04

## Author

Generated by AI Assistant (Antigravity)
