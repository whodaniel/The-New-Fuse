# Drive Source Governance Alignment — 2026-08-22

## Distinction

TNF uses Google Drive in two different relationships that must not be conflated:

1. **Shared TNF/corporate source library** — curated project/business evidence used by authorized agents.
2. **Per-user personal Drive context** — user-owned sources/memory under the user's storage profile.

The shared TNF source library may be indexed by corporate governance artifacts such as a source manifest or audit ledger. A real user's personal Drive root is resolved from that user's private TNF profile.

## Shared-source rule

Drive artifacts do not become canonical TNF product authority by filename, folder placement, or recent modified time. Current repository protocol/code state wins for TNF product claims.

## Personal-source rule

User-owned Drive content is never broadly hydrated into the core fleet by default. Agents first resolve the active user profile and logical collection, then read only authorized task-relevant material.

## Common receipt fields

Whether a source is shared/corporate or personal, consequential retrieval should retain:

- Drive File ID/object reference;
- source URL when appropriate;
- modified/revision metadata;
- classification/sensitivity;
- retrieval time;
- consumer/scope;
- authority/freshness status.

## No path drift

The corporate Drive source library is reached through its curated index/manifests. User personal Drive is reached through `USER_CONTEXT_STORAGE_MANDATE` + the active profile resolver. Neither should be replaced by one agent vendor's hard-coded path or MCP config.
