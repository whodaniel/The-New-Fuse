# Provider Configuration Reference

User-editable LLM provider registry and resolver tolerances.

- **File:** `~/.config/tnf/providers.json`
- **Override path:** `TNF_PROVIDER_CONFIG_PATH` (used by tests and by callers
  managing their own config root)
- **Implementation:** `packages/tnf-cli/src/services/provider-config.ts`
- **Consumer:** `packages/tnf-cli/src/services/ModelsService.ts`

The file is optional. With no file present, TNF uses the built-in provider list
and default tolerances, and reports `source: "defaults"`.

## Why this exists

Before 2026-08-05 the provider list was a hardcoded array inside
`ModelsService.listProviders()`. That made it the fourth uncoordinated copy of
"which providers exist" on a typical TNF machine, alongside
`~/.hermes/scripts/model-watchdog.py` (`PROVIDER_DEFS`),
`~/.hermes/skills/rate-limit-failover-routing/`, and the OpenClaw model chain.
Four lists means four drift surfaces and nowhere for a user to change behaviour.

This file is intended to become the single source those other consumers query
rather than duplicate.

## Schema

```jsonc
{
  "providers": [
    {
      "id": "openai", // required; matches a built-in to override it
      "name": "OpenAI", // optional; inherited from built-in
      "envKey": "OPENAI_API_KEY", // required for new providers
      "baseUrl": "https://api.openai.com/v1", // required for new providers
      "tier": 70, // lower is tried first
      "enabled": true, // false keeps it defined but out of resolution
    },
  ],
  "tolerances": {
    "cacheExpiryMs": 86400000, // how long a cached model list stays fresh
    "fetchTimeoutMs": 10000, // per-provider probe budget
  },
}
```

Both top-level keys are optional.

## Merge semantics

The file is an **override layer, not a replacement**:

- Entries are merged over built-ins **by `id`**. Fields you omit are inherited.
- Built-in providers you do not mention are **preserved**. Deleting a key can
  never empty the registry.
- Providers are returned sorted by `tier` ascending, then by `id`.
- To remove a provider from resolution, set `"enabled": false`. It stays visible
  for diagnostics.

## Degradation rules

The loader never fails closed, and never fails silently:

| Condition                             | Result              | Reported                |
| ------------------------------------- | ------------------- | ----------------------- |
| File absent                           | built-in defaults   | no warning (normal)     |
| File is malformed JSON                | built-in defaults   | warning naming the file |
| `providers` is not an array           | built-in list       | warning                 |
| Entry has no `id`                     | entry dropped       | warning with index      |
| New entry lacks `baseUrl` or `envKey` | entry dropped       | warning naming the id   |
| Tolerance is non-numeric or ≤ 0       | built-in value kept | warning naming the key  |
| Unknown tolerance key                 | ignored             | warning                 |

Callers surface these via `ModelsService.getConfigWarnings()`. A provider list
that quietly loses entries is how a failover chain stops failing over, so
warnings must never be discarded.

## Probe status

`ModelsService.listProviders()` reports an explicit outcome per provider:

| Status         | Meaning                                                             |
| -------------- | ------------------------------------------------------------------- |
| `unconfigured` | no credential in `envKey` — a coverage condition, not a failure     |
| `probe_failed` | credential present but the probe failed; `error` carries the reason |
| `ok`           | probe succeeded                                                     |

Previously all three collapsed into an empty array, so a `401`, a `429`, and a
provider that genuinely lists no models were indistinguishable — and failover
could not route around a failure it could not see.

Probes are time-boxed by `tolerances.fetchTimeoutMs`; a timeout surfaces as
`probe timed out after <n>ms`.

## Examples

Prefer a local endpoint above everything else:

```json
{
  "providers": [
    {
      "id": "local",
      "name": "Local",
      "envKey": "LOCAL_API_KEY",
      "baseUrl": "http://localhost:1234/v1",
      "tier": 1
    }
  ]
}
```

Tighten probe latency and disable a metered provider:

```json
{
  "providers": [{ "id": "openai", "enabled": false }],
  "tolerances": { "fetchTimeoutMs": 2000 }
}
```

## Verification

```bash
pnpm --filter @the-new-fuse/tnf-cli test   # includes provider-config.test.ts
```
