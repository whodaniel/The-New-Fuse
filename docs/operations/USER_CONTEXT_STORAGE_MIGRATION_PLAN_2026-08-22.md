# User Context Storage Migration Plan — 2026-08-22

## Goal

Move TNF from scattered provider- or operator-specific context locations toward one profile-resolved contract without deleting user data or breaking legacy harnesses.

## Phase 0 — Contract

Implemented in the current topic branch:

- storage mandate;
- profile schema/defaults;
- resolver + configurator;
- onboarding strategy selection;
- core fleet/scope inheritance semantics;
- user projection cleanup;
- Drive integration guide correction.

## Phase 1 — Local provider

1. Make `tnf-user://<profile>/<collection>` the logical address used by agent-facing context APIs.
2. Create local collection directories lazily under the resolved local root.
3. Record read/write receipts for consequential context operations.
4. Add migration/import helpers for legacy private memory/user overlay locations without deleting originals.

## Phase 2 — Google Drive provider

1. Implement approved Drive OAuth adapter.
2. Store credentials/tokens in OS/private credential storage.
3. Bind the user-authorized Drive root into the private TNF profile.
4. Verify read/write against the `receipts` collection before marking Drive ready.
5. Project Drive capability into provider-specific MCP/harness configs from TNF state.
6. Remove simulated success states from the desktop Drive wizard.

## Phase 3 — Hosted thenewfuse.com

1. Add authenticated user storage settings matching the same strategy enum and logical collections.
2. Store provider credentials privately server-side; keep public contract/provider binding separate.
3. Support Drive-primary/mirrored workflows with explicit revision/conflict receipts.
4. Support local-machine storage only through an authorized local bridge/desktop runtime; browser sessions must not pretend arbitrary local filesystem access.

## Phase 4 — Fleet enforcement

1. Core fleet hydrates user-context locations from the active profile resolver.
2. Child swarms inherit parent/user mapping by default.
3. Agent-scoped overrides require explicit authority and are logged in receipts.
4. Drift checks flag hard-coded personal paths, Drive folder IDs, or provider-specific context registries in shared source.

## Phase 5 — Legacy cleanup

After migration receipts exist:

- classify old USER/MEMORY/provider-specific locations as migrated, historical, or still active;
- preserve original private data until user-approved retirement;
- remove only stale product-level references, not user data;
- document rollback and recovery paths.

## Non-negotiable safety

No migration step may silently delete, overwrite, or publish user-owned context. Conflicts are surfaced for user/operator resolution.
