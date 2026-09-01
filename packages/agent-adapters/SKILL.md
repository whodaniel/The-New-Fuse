---
name: google-agents-cli-adapter
description: >
  Interoperability adapter bridging the TNF Envelope Protocol and Google Agents
  CLI JSON-RPC 2.0. Enables TNF agents to invoke Google Agents CLI tools and
  receive results as native TNF envelope messages — with full error spec
  preservation.
version: 0.1.0
package: '@the-new-fuse/agent-adapters'
---

# Google Agents CLI Adapter Skill

## Overview

`@the-new-fuse/agent-adapters` provides a **stateless, pure-function adapter**
that translates between:

- **TNF Envelope Protocol** (`tnf-envelope/v1`) — the standard message bus
  format
- **Google Agents CLI JSON-RPC 2.0** — the wire format for Google Agents tool
  invocations

The adapter is side-effect free. Every translation is a deterministic function
of its input with no I/O.

## Key Classes & Functions

### `GoogleAgentsCliAdapter`

```typescript
import { GoogleAgentsCliAdapter } from '@the-new-fuse/agent-adapters';

const adapter = new GoogleAgentsCliAdapter({
  invokeMethod: 'agents.tool.invoke', // default
  adapterName: 'google-agents-cli', // default
  staticMeta: { team: 'my-team' }, // optional; injected into every outbound request
});
```

#### `toJsonRpcRequest(envelope)` — TNF → Google

Converts a `tool-invoke` TNF envelope into a JSON-RPC 2.0 request.

```typescript
const rpcReq = adapter.toJsonRpcRequest({
  id: 'msg-001',
  source: 'orchestrator',
  kind: 'tool-invoke',
  timestamp: new Date().toISOString(),
  protocol: 'tnf-envelope/v1',
  payload: { tool: 'search', input: { query: 'TNF docs' } },
});
// → { jsonrpc: '2.0', id: 'msg-001', method: 'agents.tool.invoke', params: { name: 'search', arguments: { query: 'TNF docs' }, meta: { ... } } }
```

#### `envelopeFromJsonRpc(response, context?)` — Google → TNF

Converts a JSON-RPC 2.0 response back into a TNF envelope.

```typescript
const envelope = adapter.envelopeFromJsonRpc(
  { jsonrpc: '2.0', id: 'msg-001', result: { hits: [...] } },
  { source: 'orchestrator', tool: 'search' },
);
// → TNFEnvelopeMessage<{ hits: [...] }> with kind: 'tool-result'
```

#### `mapTNFErrorToJsonRpc(error)` / `mapJsonRpcErrorToTNF(error)`

Bijective error mapping. TNF error codes map to deterministic JSON-RPC numeric
codes:

| TNF Error Code                 | JSON-RPC Code |
| ------------------------------ | ------------- |
| `TNF_TOOL_VALIDATION_FAILED`   | `-32001`      |
| `TNF_TOOL_EXECUTION_FAILED`    | `-32002`      |
| `TNF_TOOL_SANITIZATION_FAILED` | `-32003`      |
| `TNF_TOOL_TIMEOUT`             | `-32004`      |
| _(anything else)_              | `-32000`      |

### `createGoogleAgentsCliAdapter(options?)` — factory

Convenience factory wrapping `new GoogleAgentsCliAdapter(options)`.

---

## Integration Patterns

### Pattern 1: Wrap a TNF tool handler for Google Agents CLI

```typescript
// In your MCP server or broker surface:
import { createGoogleAgentsCliAdapter } from '@the-new-fuse/agent-adapters';

const adapter = createGoogleAgentsCliAdapter();

async function callGoogleTool(
  envelope: TNFEnvelopeMessage<TNFToolInvokePayload>
) {
  const rpcReq = adapter.toJsonRpcRequest(envelope);
  // ... send rpcReq over stdio/http transport ...
  const rpcRes = await sendToGoogleAgentsCli(rpcReq);
  return adapter.envelopeFromJsonRpc(rpcRes, {
    source: envelope.source,
    tool: envelope.payload.tool,
  });
}
```

### Pattern 2: MicroToolAdapter bridge (item 3 from opencode roadmap)

Once implemented, `MicroToolAdapter` wraps any `MicroTool` as a legacy
`ToolHandler` so MCP servers and broker surfaces serve stateless tools
automatically:

```typescript
// Planned — not yet implemented
import { MicroToolAdapter } from '@the-new-fuse/agent-adapters';
const handler = MicroToolAdapter.wrap(myMicroTool);
mcpServer.registerTool(handler);
```

---

## CLI Commands

> [!NOTE] These commands are **planned** — they are not yet in
> `packages/tnf-cli/src/commands/`. When implemented, they will extend the
> existing `google-ai` command group or get a dedicated `ga` subcommand. Adding
> them requires updating the command-surface oracle (see
> `tnf-command-surface-gate` skill).

| Command            | Description                                         |
| ------------------ | --------------------------------------------------- |
| `tnf ga:invoke`    | Invoke a Google Agents CLI tool via the adapter     |
| `tnf ga:status`    | Check adapter + Google Agents CLI endpoint health   |
| `tnf ga:map-error` | Translate a TNF or JSON-RPC error code (diagnostic) |

---

## Testing

```bash
# Run unit tests (round-trip invariants)
cd packages/agent-adapters
pnpm test
```

Key invariants to verify:

1. `toJsonRpcRequest → envelopeFromJsonRpc` identity for success paths
2. `mapTNFErrorToJsonRpc → mapJsonRpcErrorToTNF` bijection for all 4 known error
   codes
3. Throws on non-`tool-invoke` envelope in `toJsonRpcRequest`

---

## Roadmap

- [ ] **MicroToolAdapter**: wrap any MicroTool as legacy ToolHandler (item 3)
- [ ] **Test suite**: vitest round-trip invariants (item 4)
- [ ] **CLI commands**: `tnf ga:invoke`, `tnf ga:status`, `tnf ga:map-error`
      (item 5)
- [ ] **Live transport**: `--transport stdio|http` for real Google Agents CLI
      endpoint (item 6)
- [ ] **Skill ubiquity**: propagate to `.opencode/skills`, `.claude/skills` etc.
      (item 7)
