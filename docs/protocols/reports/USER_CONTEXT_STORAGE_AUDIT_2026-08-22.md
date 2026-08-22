# User Context Storage Audit — 2026-08-22

## Scope

Audit TNF user-owned context storage and retrieval pathways with emphasis on local-machine storage and Google Drive, and eliminate provider-specific path drift across core fleet, child swarms, and agents.

## Findings

1. The personalized onboarding wizard already persists per-user profiles under `~/.tnf/profiles/<profile>.json`, but the profile did not previously include a canonical user-context storage binding.
2. `docs/core/USER.md` contained operator-specific personal details in repository source, conflicting with a reusable multi-user profile boundary.
3. Existing memory/user-data work already distinguishes private/local user overlays from distributable system state.
4. `data/mcp_config.json` is a system capability registry and should not carry real-user Drive bindings.
5. The Tauri desktop Google Drive wizard is currently simulated; UI timers can imply install/auth success without backend proof.
6. The previous MCP integration guide pointed toward a Gemini-specific MCP config path, which would allow one harness to become accidental storage authority.
7. Existing protocol rails already prohibit personal hard-coded paths and independently authoritative frontload lists; a user-context resolver should follow the same pattern.

## Adopted contract

The TNF profile is the authority for logical user-context storage. Providers sit underneath the contract.

Stable logical collections:

- `profile`
- `sources`
- `memory`
- `working`
- `receipts`
- `exports`

Initial provider strategies:

- `local-primary`
- `google-drive-primary`
- `mirrored`
- `local-only`

Inheritance:

- core fleet → active user profile;
- swarm → parent/user profile;
- agent → parent/user profile;
- scoped overrides require explicit authority and receipts.

## Implementation in this branch

- add `USER_CONTEXT_STORAGE_MANDATE.md`;
- add machine-readable defaults + JSON schema;
- add shared resolver and tests;
- add private profile configurator;
- add storage strategy to onboarding profile;
- frontload the new protocol only for classification/user-context work;
- make `USER.md` a profile-neutral projection rather than committed personal state;
- revise Drive MCP guide so provider/harness configs are projections, not canonical location registries.

## Safety behavior

A Drive-primary or mirrored profile with no bound Drive root does not pretend to be ready. Resolution degrades visibly to local with `google-drive-binding-missing`.

No real Drive folder ID, OAuth token, credential file, or operator-specific absolute path belongs in repository source.

## Remaining work

- implement real Tauri Drive adapter/OAuth/keychain commands;
- make Drive wizard fail closed until backend receipts exist;
- implement authenticated thenewfuse.com user profile/storage binding using the same logical contract;
- project Drive capability into provider-specific MCP/harness configs from TNF state;
- add provider sync/conflict receipts for mirrored mode;
- migrate any remaining committed/private operator projections behind the profile boundary after audit.

## Verification status

Source-level compare against `main` confirms this branch is based on canonical `main` at `6013b5322aea28a03e5d93ecf7e60bd67cd83c5c` and changes only the scoped storage/profile/protocol surfaces listed above.

Unit tests for `resolve-storage.cjs` are authored but have not been executed by this connector session; CI/local execution remains required before merge.
