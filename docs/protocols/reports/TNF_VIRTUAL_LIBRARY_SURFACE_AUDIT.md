# TNF Virtual Library Surface Audit

- Generated (UTC): `2026-05-03T19:31:31.255010+00:00`

## Canonicalization Decision
- Canonical codebase: `/Users/<owner>/Projects/virtual-library-blueprints`
- Monorepo mirror: `/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/virtual-library-blueprints`

## Git State
- Canonical branch/head: `codex/story-privacy-wall` / `f0f9f115c12850a77bd1ac0d45ec9655f733b10e`
- Mirror branch/head: `main` / `0cbcd8ba7534e97be2ad1e254fc82b61e869c6fa`
- Head mismatch: `True`
- Branch mismatch: `True`
- Remote mismatch: `False`

## Runtime Surface Classification
- `.kilo` path: `/Users/<owner>/.kilo`
- `.kilo` dependencies: `{"@kilocode/plugin": "7.1.9"}`
- `.opencode` path: `/Users/<owner>/.opencode`
- `.opencode` dependencies: `{"@kilocode/plugin": "7.1.9", "@opencode-ai/plugin": "1.2.5"}`
- `.gemini` path: `/Users/<owner>/.gemini`
- `.gemini` skills discovered: `10`

## Story Data Authority
- Authoritative tables:
  - `story_sessions`
  - `story_answers`
  - `note_cards`
  - `timeline_events`
  - `library_navigation`
  - `story_session_agent_grants`

## Coherence Rules
- Edit Virtual Library code only in canonical codebase first.
- Sync to monorepo mirror after validation.
- Treat `.kilo`, `.opencode`, and `.gemini` as runtime surfaces, not source-of-truth story content.
- Enforce owner-scoped privacy wall (`owner_principal_id`, release gating, grants).
