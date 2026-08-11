`[CLASS:PRIME] [STATUS:ACTIVE]`

# TNF Adaptable Host Verification

**Protocol ID:** `TNF_ADAPTABLE_HOST_VERIFICATION`  
**Status:** ACTIVE  
**Scope:** Autonomy health, sub-director cycle checks, frontload verification,
and any gate that historically assumed a fixed host pack (especially OpenClaw).

## Purpose

TNF is the assimilator and control plane. Host surfaces (OpenClaw, Hermes,
Cursor, Codex, Claude Code, Pi, …) come and go. Verification must **discover
what is enlisted right now** and adapt checks to that surface set — not freeze
stale expectations from a previous operator environment.

Stale assumptions (for example “OpenClaw `LATEST.md` must be fresh”) produce
false **degraded** / **critical** signals and divert agents from real work.

## Work Plane Separation (OSS vs tenant / personal)

Frontload, Turn Zero, and self-prompting must keep these planes distinct:

| Plane                              | Audience                                          | May land on public `main` | Examples                                                                                               |
| ---------------------------------- | ------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Core OSS / Super Admin harness** | All deployers + TNF core maintainers              | Yes                       | Protocols, CLI surfaces, gated optional adapters (`tnf spark` via `TNF_SPARK_*`), adaptable host rules |
| **Deployer config**                | Whoever runs this install                         | No (local / private)      | Env keys, MCP URLs, bus endpoints, API tokens                                                          |
| **Tenant / personal user work**    | One account (e.g. hosted app.thenewfuse.com user) | No                        | Personal Living State mirrors, Gmail/Docs targets, user goals, per-tenant Supabase rows                |

Rules:

1. **Do not commit personal or tenant-specific state into the OSS tree.**
2. **Generalized features** (any deployer can enable) belong in OSS; **one
   user's destinations and data** belong in tenant DB and/or local-only config.
3. Agents improving the harness work on the **core plane**. Agents helping a
   human with personal projects keep artifacts off `main` unless they are
   deliberately generalized and sanitized.

## Rules

1. **Canonical authority is TNF-native.** Live handoff truth is
   `docs/protocols/reports/SESSION_HANDOFF_LATEST.{json,md}` and
   `~/.tnf/handoff-current.json`. Host-local pointers are secondary and
   optional.
2. **Enlistment before enforcement.** A host-specific freshness or presence
   check may **degrade** autonomy only when that host is enlisted:
   - explicit opt-in (`TNF_OPENCLAW_REQUIRED=1`, `TNF_OPENCLAW_ACTIVE=1`, or
     `FRONTLOAD_REQUIRE_OPENCLAW_LATEST=1`), **or**
   - live process discovery of an active host runtime.
3. **Inactive hosts are advisory.** If OpenClaw (or any optional host) is not
   enlisted, missing/stale host artifacts are notes/actions only — never a
   standing health degrade.
4. **Explore then verify.** Prefer
   `Inspect → discover enlisted surfaces → verify those surfaces` over static
   checklists that encode yesterday’s stack.
5. **Do not characterize TNF as an OpenClaw subset.** OpenClaw is an optional
   interoperability / assimilation host TNF may route through.

## Implementation touchpoints

| Surface                                  | Behavior                                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `.skills/.../subdirector-cycle-check.sh` | OpenClaw LATEST age degrades only when enlisted; otherwise require TNF canonical handoff |
| `scripts/verify_frontload_state.sh`      | OpenClaw LATEST optional by default                                                      |
| `.skills/tnf-frontload-protocols/`       | Same contract; OpenClaw docs describe optional host, not SoT                             |
| Autonomy rollup                          | Must not treat optional-host notes as stack-critical                                     |

## Operator overrides

```bash
export TNF_OPENCLAW_REQUIRED=1   # hard-require OpenClaw LATEST freshness
export TNF_OPENCLAW_ACTIVE=1     # treat OpenClaw as enlisted without process discovery
export FRONTLOAD_REQUIRE_OPENCLAW_LATEST=1
```

## Related

- `docs/protocols/TURN_ZERO_MANDATE.md` — System Boundary + Work Plane
  Separation
- `docs/protocols/DIRECTIVES.md` — System Boundary / OpenClaw policy / work
  planes
- `docs/protocols/GEMINI_SPARK_INTEGRATION_SPEC.md` — optional env-gated adapter
  pattern
- `docs/protocols/HARNESS_CONFIG.md` — harness vs host pack distinction
- `docs/protocols/SESSION_HANDOFF_ENFORCEMENT.md` — TNF handoff authority
