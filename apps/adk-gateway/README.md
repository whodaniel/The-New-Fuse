# TNF Google ADK Gateway

This service is the Python adapter gateway between TNF (TypeScript orchestration layer) and Google ADK runtime capabilities.

## Current Scope

1. `GET /v1/health`
2. `GET /v1/capabilities`
3. `POST /v1/execute` (stub or real ADK execution)
4. `POST /v1/execute/stream` (stub or real ADK streaming)

## Run Locally

```bash
cd apps/adk-gateway
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8089 --reload
```

## Environment Variables

1. `ADK_GATEWAY_STUB_MODE` (`true` by default)
2. `ADK_DEFAULT_MODEL` (`gemini-2.5-pro` by default)
3. `ADK_GATEWAY_API_KEY` (optional; when set, required via `x-adk-gateway-key` header)
4. `ADK_REQUEST_TIMEOUT_MS` (gateway-side timeout cap, default `120000`)
5. `GOOGLE_API_KEY` (recommended for Gemini API auth in real mode)
6. `GEMINI_API_KEY` (accepted alias; copied into `GOOGLE_API_KEY` at runtime)
7. Vertex alternative:
   - `GOOGLE_GENAI_USE_VERTEXAI=true`
   - `GOOGLE_CLOUD_PROJECT`
   - `GOOGLE_CLOUD_LOCATION`

## Real Mode

Set `ADK_GATEWAY_STUB_MODE=false` to route requests through Google ADK (`LlmAgent` + `Runner` + `InMemorySessionService`).  
If credentials are missing in real mode, `/v1/execute` and `/v1/execute/stream` return HTTP `503`.

Streaming behavior in real mode:
1. Successful streams emit `chunk` events followed by `done` with `"status":"ok"`.
2. Runtime streaming failures emit an `error` event followed by `done` with `"status":"error"`.

## Example Request

```bash
curl -sS http://localhost:8089/v1/execute \
  -H 'Content-Type: application/json' \
  -d '{
    "requestId": "req-1",
    "traceId": "trace-1",
    "workspaceId": "ws-1",
    "agentId": "agent-1",
    "model": "gemini-2.5-pro",
    "input": {"messages":[{"role":"user","content":"hello from tnf"}]},
    "tools": [],
    "metadata": {"source":"tnf-smoke","policyProfile":"default"},
    "timeoutMs": 120000
  }'
```
