# TNF Launchd Runtime Pattern

Use this reference when editing macOS LaunchAgents for TNF local services.

## Service Policy

- Prefer `RunAtLoad=true` plus `StartInterval`.
- Avoid `KeepAlive` for optional local runtime components unless the service is
  a tiny supervisor whose own loop has dependency backoff.
- `start` commands must be idempotent and should not call `launchctl bootout` on
  healthy jobs.
- `restart` may unload and reload, but must restart in dependency order.
- `stop` may unload, but should not delete plists or runtime state.

## Dependency Order

1. Redis local bus
2. API local service
3. API gateway
4. Voice watchdog
5. KWS/voice helpers

Gateway startup should wait for the local API TCP port. Voice/KWS startup should
tolerate absent optional binaries.

## Portability Requirements

- Derive repo paths from the script location.
- Derive user runtime paths from `$HOME`.
- Put generated plists in `~/Library/LaunchAgents`.
- Put generated local secrets in `~/.tnf.local.env` with mode `0600`.
- Never write user-specific paths, secrets, or relay endpoints into committed
  source.

## Proof Before Completion

Prove both service manager state and endpoint state. A LaunchAgent can be
`running` while its endpoint is not healthy, and an endpoint can be healthy
while preflight still misclassifies the port.
