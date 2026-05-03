# TNF Virtual Library Consolidation Protocol

## Purpose
Establish one coherent source-of-truth model for Story Architect and Virtual Library assets across:
- `~/Projects/virtual-library-blueprints`
- `~/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/virtual-library-blueprints`
- runtime agent surfaces in `~/.kilo`, `~/.opencode`, and `~/.gemini`

## Canonical Decisions
- Canonical Virtual Library codebase: `~/Projects/virtual-library-blueprints`
- Monorepo mirror (derived copy): `~/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/virtual-library-blueprints`
- Runtime surfaces (non-authoritative for story content): `~/.kilo`, `~/.opencode`, `~/.gemini`

## Data Authority
Story artifacts are authoritative only when persisted through the Virtual Library data model:
- `story_sessions`
- `story_answers`
- `note_cards`
- `timeline_events`
- `library_navigation`
- `story_session_agent_grants`

Owner privacy and release gates are mandatory:
- `owner_principal_id`
- `visibility_scope`
- `release_state`
- `agent_allowlist`

## Required Workflow
1. Edit and validate in canonical repo (`~/Projects/virtual-library-blueprints`).
2. Run mirror dry-run: `scripts/autonomy/sync_virtual_library_mirror.sh`.
3. Apply mirror sync after verification: `scripts/autonomy/sync_virtual_library_mirror.sh --apply`.
4. Refresh audit map: `python3 scripts/autonomy/virtual_library_surface_audit.py`.
5. Use generated artifacts as routing anchors: `docs/protocols/storage/tnf-virtual-library-surface-map.json` and `docs/protocols/reports/TNF_VIRTUAL_LIBRARY_SURFACE_AUDIT.md`.

## TNF CLI Entrypoints
- `tnf library status --refresh`
- `tnf library audit`
- `tnf library sync` (dry-run)
- `tnf library sync --apply`
- `tnf library sync --apply --delete` (destructive mirror prune)

## Runtime Hygiene Rules
- Do not treat `~/.gemini/GEMINI.md` as authoritative story content storage.
- Do not store raw secrets/tokens in agent memory artifacts.
- Treat `.kilo` and `.opencode` as execution surfaces only; they can enrich workflow, but cannot overrule canonical data or privacy policy.

## Operational Outcome
This protocol removes ambiguity between duplicated code paths and runtime state directories, while preserving:
- owner-scoped story privacy
- attribution/governance constraints
- predictable multi-agent handoffs
