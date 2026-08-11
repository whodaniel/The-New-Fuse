# Gemini Spark Integration Spec (Optional Adapter)

`[CLASS:INTEL] [STATUS:PENDING]`

Optional interoperability surface: any TNF deployer may connect Google Gemini
Spark / Workspace MCP. This is **not** Super Admin–only product code and must
not encode a single operator's personal workspace, Supabase tenant data, or
local identity.

## Separation Rubric (OSS vs tenant / personal)

| Layer                    | Lives in                                                   | Examples                                                      |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------- |
| Core OSS CLI / protocols | Public monorepo `main`                                     | `tnf spark` command surface, env contract, this spec          |
| Deployer config          | Local env / private config                                 | `TNF_SPARK_*`, MCP URLs, bus endpoints                        |
| Tenant / personal state  | Tenant DB (e.g. app.thenewfuse.com Supabase) or local-only | Personal Gmail/Docs targets, living-state mirrors, user goals |

Frontload (Turn Zero / onboard / self-prompt) must keep teaching this boundary:
agents improve the shared harness; personal work stays in tenant/local stores.

## What Gemini Spark is (deployer context)

- Long-horizon cloud agent runtime (when the deployer enables it).
- Expected interop: MCP / WebMCP style tool bridges.
- Scope examples: Workspace tools (Gmail, Docs, Sheets, Calendar, Drive) **only
  when the deploying tenant configures them**.

## TNF role

TNF remains the local control plane. Spark is an optional offload / MCP peer —
never “TNF ⊆ Spark”, and never a hardcoded personal intelligence profile in the
OSS tree.

```
TNF CLI / SubDirector
        |
   Synaptic / MCP bus  (TNF_SPARK_BUS_URL — deployer-local)
        |
  Workspace / Spark MCP (TNF_SPARK_WORKSPACE_MCP_* — deployer-local)
        |
   Gemini Spark worker (optional cloud)
```

## Env contract

| Variable                         | Purpose                                   |
| -------------------------------- | ----------------------------------------- |
| `TNF_SPARK_ENABLED`              | `1`/`true` to opt into the adapter        |
| `TNF_SPARK_BUS_URL`              | Bus / WS endpoint for enqueue + events    |
| `TNF_SPARK_WORKSPACE_MCP_URL`    | Workspace MCP base URL (optional)         |
| `TNF_SPARK_WORKSPACE_MCP_CONFIG` | Alternate config path/blob ref (optional) |
| `TNF_SPARK_CLOUD_ENGINE`         | Display label for engine (optional)       |

## CLI surface

```bash
tnf spark status     # reports config enablement only (no fake "connected")
tnf spark sync       # guidance / future MCP push hook
tnf spark delegate   # guidance / future enqueue hook
```

Live connection probes and personal document sync belong in deployer plugins or
tenant-backed workers — not default OSS “always connected” stubs.

## Planned follow-ups

1. Optional MCP client plugin (no secrets in repo).
2. Turn Zero / frontload checklists that name the OSS vs tenant separation.
3. Tenant-scoped sync destinations via Supabase (or equivalent) for hosted apps.
