# USER.md — Active User Projection

This file is a **product-neutral compatibility surface**, not the canonical store for a real user's personal profile.

## Canonical rule

Real user-specific identity, preferences, personal source locations, and private durable context belong in the user-controlled TNF profile/storage layer described by:

- `docs/protocols/USER_CONTEXT_STORAGE_MANDATE.md`
- `~/.tnf/profiles/<profile>.json`
- `node scripts/user-context/resolve-storage.cjs --json`

Do not commit a person's private profile, personal Google Drive folder ID, OAuth token, home-directory path, legal/medical/financial context, or personal source inventory into this repository file.

## Projection contract

When a harness needs a human-readable USER projection, derive it from the active authorized profile and include only the minimum task-relevant fields, for example:

- preferred display name;
- preferred form of address;
- timezone/locale when operationally relevant;
- current workspace/project role;
- communication preferences needed for the task;
- logical user-context collection references rather than raw provider paths.

A generated projection must preserve the user's privacy and source-storage policy. It should be considered stale when the active profile changes.

## Multi-user behavior

- Local TNF: resolve the selected local profile under `~/.tnf/profiles/`.
- `thenewfuse.com`: resolve the authenticated user's private profile from the hosted profile service/credential boundary.
- Core fleet: inherit the active user's context-storage profile for user-context work.
- Child swarms/agents: inherit their parent/user scope unless an authorized scoped override exists.

## Repository/product relationship

Repository doctrine and operational rails remain canonical in the repository. User-specific context remains user-controlled and is hydrated only when a task requires it.

**Universalize the pattern, not the private context.**
