# TNF Library Registry Surface

`[CLASS:PRIME] [STATUS:LOCKED] [DOC_TYPE:INDEX] [VISIBILITY:AGENT_SCOPE] [OWNER:DANIEL_GOLDBERG]`

## Purpose

Provide a deterministic, agent-readable home for manuscript discovery metadata
without forcing private narrative content into public/shared docs.

## Rules

1. All manuscript and story artifacts must be represented in
   `docs/library/REGISTRY.md`.
2. Manuscript docs must use `DOC_TYPE` values:
- `BOOK_MANUSCRIPT`
- `STORY_OUTLINE`
- `STORY_CHAPTER`
- `STORY_NOTE`
3. For manuscript doc types, include `[WORK_ID:<stable_slug>]`.
4. Private story content remains owner-scoped by default:
- `[VISIBILITY:PRIVATE]` or `[VISIBILITY:AGENT_SCOPE]`
- `[OWNER:<principal>]` required.

## Canonical Process

1. Register the work in `docs/library/REGISTRY.md` first.
2. Store private source content in owner-scoped Virtual Library storage
   (`story_sessions`, `story_answers`, related tables).
3. Promote to collective/public only via explicit release-state transition.
