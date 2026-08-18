`[CLASS:PRIME] [STATUS:LOCKED] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:COLLECTIVE]`

# TNF Turn End Mandate — V2

**Status:** ACTIVE  
**Protocol ID:** `TNF_TURN_END_CANONICAL`

## Purpose
Turn End writes a compact machine-readable receipt of what changed, what context it belongs to, which capabilities were involved, what remains uncertain, and how the next session should resume.

## Preferred command
```bash
node scripts/turn-end-v2.cjs
```

Current spec: `tnf/session-handoff/0.2`  
Schema: `docs/protocols/schemas/tnf-session-handoff.schema.json`

## Required V2 context

### Repository context
Record the **actual** repository/origin plus canonical TNF source `whodaniel/tnf-monorepo`, branch, HEAD, dirty state, and publication targets. Internal TNF development occurs in the monorepo; public forks may record their actual fork identity.

### Classification
Record work domain, artifact destination, data residency, and sensitivity. Unknown must remain explicit.

### Capabilities
Record capabilities required and providers/harnesses that staffed them when known.

### Publication impact
Record whether public runtime, private control plane, or satellites are affected. This is routing context, not publication authorization.

### Freshness and verification
Carry compact freshness receipts and actual verification results. Prefer `na` to invented success.

## Privacy-preserving propagation
**Universalize the pattern, not the private context.** A private personal/client/tenant session does not become a public artifact merely because it produced useful learning.

## Session completion
Substantial sessions should leave canonical JSON/Markdown handoff, next actions, classification, repo/capability/freshness receipts, and verified changed artifacts as available. Tiny conversational sessions need not create ritual churn.

## Publication rule
Internal development remains in `whodaniel/tnf-monorepo`; publication follows `docs/REPO_SEPARATION.md`. External forks record their own repository and contribute through the public contribution path.

## Governance
Turn Zero and Turn End are paired protected lifecycle documents. Future changes must evaluate onboarding, handoff, freshness, classification, capability staffing, privacy, and publication routing.
