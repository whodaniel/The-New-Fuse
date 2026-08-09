# apps/mcp-servers

Umbrella folder for **OSS local MCP bridge** packages shipped with the TNF
runtime. There is no root `package.json` — each child is its own workspace
package (`pnpm-workspace` glob `apps/mcp-servers/*`).

## Packages (live)

| Directory            | Package                           | Role                       |
| -------------------- | --------------------------------- | -------------------------- |
| `tnf-network-mcp/`   | `@the-new-fuse/tnf-network-mcp`   | TNF network management MCP |
| `devops-bridge/`     | `@the-new-fuse/devops-bridge-mcp` | DevOps / infra MCP bridge  |
| `vision-bridge-mcp/` | `@the-new-fuse/vision-bridge-mcp` | Native vision bridge MCP   |

Wire / onboard references: `scripts/tnf-onboard.cjs` (tnf-network,
devops-bridge).

Related but **not** under this folder:

- `packages/mcp-*` — library MCP helpers
- `TNF-Extensions/telegram-mcp` — optional Telegram adapter (satellite)

## Root helpers

| File         | Notes                                          |
| ------------ | ---------------------------------------------- |
| `health.mjs` | Tiny `/health` HTTP helper for local checks    |
| `_archive/`  | Retired loose WS stub scripts (see ARCHIVE.md) |

## Prefer

```bash
pnpm --filter @the-new-fuse/tnf-network-mcp build
pnpm --filter @the-new-fuse/devops-bridge-mcp build
pnpm --filter @the-new-fuse/vision-bridge-mcp build
```

Do not revive root `claude-mcp-server.js` / `gemini-mcp-server.js` stubs — they
were echo/toolbox demos, not protocol MCP servers.
