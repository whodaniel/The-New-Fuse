# TNF Local Runtime Profile

TNF supports local-only runtime assets such as personal paths, local relay URLs, and known occupied development ports. These values are valid operational assets, but they must live behind a configuration boundary instead of being hardcoded into distributed source.

## Policy

- Use repo-relative paths in committed scripts and docs whenever possible.
- Use `TNF_ROOT` only as an operator override for a specific machine or deployment.
- Use `TNF_RELAY_URL`, `RELAY_WS_URL`, or `RELAY_URL` for relay endpoints instead of hardcoded WebSocket URLs.
- Use `TNF_PORTS` to add local service ports to the port catalog.
- Use `TNF_PORTS_ALLOW_OCCUPIED` when a listener is intentional during preflight.
- Keep personal paths, private endpoints, tokens, and operator-only values in ignored files.

## Local Files

TNF CLI helpers read these files from the repository root:

```text
.env
.env.local
.tnf.local.env
```

Precedence:

```text
exported shell env > .tnf.local.env > .env.local > .env > built-in defaults
```

The loader is non-executing: it parses `KEY=value` lines and does not run shell code. Existing exported environment variables are never overwritten.

## Example

```bash
# .tnf.local.env
TNF_ROOT=/Users/example/projects/fuse
TNF_RELAY_URL=ws://127.0.0.1:3000/ws
TNF_PORTS=8080:custom-api,9000:custom-ws
TNF_PORTS_ALLOW_OCCUPIED=3005,6379
```

## Guardrail

A hardcoded local value is acceptable only when it is a documented local default and can be overridden by environment configuration. A personal absolute path is never acceptable in distributable code, docs, skills, or agent prompts.

Run these guards before claiming release or clean-room readiness:

```bash
pnpm run local-runtime:guard
pnpm run cleanroom:guard
```

`cleanroom:guard` is daemon-independent. It verifies `Dockerfile.cleanroom` and `.dockerignore` even when Docker Desktop is not running.
