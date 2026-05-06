# TNF Virtual Library Surface Audit

- Generated (UTC): `2026-05-06T21:14:10.589768+00:00`

## Canonicalization Decision

- Canonical codebase: `~/Projects/virtual-library-blueprints`
- Monorepo mirror:
  `~/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/virtual-library-blueprints`

## Git State

- Canonical branch/head: `codex/story-privacy-wall` /
  `2a7a824eedd05a37644747e9bc411b8560d52797`
- Mirror branch/head: `main` / `650d1682d3c9ec50cc7df95e233e3802c6a2ddf5`
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
- `.gemini` skills discovered: `15`

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
