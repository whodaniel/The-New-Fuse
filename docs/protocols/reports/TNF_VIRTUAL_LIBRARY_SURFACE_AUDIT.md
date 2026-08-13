`[CLASS:PRIME] [STATUS:PENDING]` `[DOC_AUDIT_BACKFILL:2026-07-14]` — header
restored for Gate 3 compliance; reclassify on next vetting pass.

# TNF Virtual Library Surface Audit

- Generated (UTC): `2026-06-26T18:03:55.620490+00:00`

## Canonicalization Decision

- Canonical codebase: `~/Projects/virtual-library-blueprints`
- Monorepo mirror:
  `~/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/virtual-library-blueprints`

## Git State

- Canonical branch/head: `codex/story-privacy-wall` /
  `8d84bd805911a256461d84ed8aac6488b20d4685`
- Mirror branch/head: `main` / `994f3d3e013bdf09201b36c3a13b8f339b7a3f79`
- Head mismatch: `True`
- Branch mismatch: `True`
- Remote mismatch: `False`

## Runtime Surface Classification

- `.kilo` path: `~/.kilo`
- `.kilo` dependencies: `{"@kilocode/plugin": "7.1.9"}`
- `.opencode` path: `~/.opencode`
- `.opencode` dependencies:
  `{"@kilocode/plugin": "7.1.9", "@opencode-ai/plugin": "1.2.5"}`
- `.gemini` path: `~/.gemini`
- `.gemini` skills discovered: `2`

## Story Data Authority

- Authoritative tables:
  - `story_sessions`
  - `story_answers`
  - `note_cards`
  - `timeline_events`
  - `library_navigation`
  - `story_session_agent_access`

## Coherence Rules

- Edit Virtual Library code only in canonical codebase first.
- Sync to monorepo mirror after validation.
- Treat `.kilo`, `.opencode`, and `.gemini` as runtime surfaces, not
  source-of-truth story content.
- Enforce owner-scoped privacy wall (`owner_principal_id`, release gating,
  grants).
