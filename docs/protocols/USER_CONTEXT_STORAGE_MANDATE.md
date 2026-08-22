`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:COLLECTIVE]`

# TNF User Context Storage Mandate

**Protocol ID:** `TNF_USER_CONTEXT_STORAGE`  
**Spec:** `tnf/user-context-storage/0.1`

## Purpose

TNF must not make every agent, harness, swarm, or UI invent its own place to read and write a user's personal context. The user's TNF profile is the authority for **logical user-context locations**. Storage providers are adapters beneath that contract.

The first-class providers are:

1. `local` — local-machine durable storage;
2. `google_drive` — user-authorized Google Drive storage.

Other providers may be added later without changing the logical collection names used by agents.

## Core invariant

**Agents address logical TNF user-context collections; the resolver maps those collections to provider-specific locations.**

Do not hard-code operator home directories, Google Drive folder IDs, provider-specific MCP config paths, or one agent vendor's storage conventions in shared product logic.

## Authority order

For user-context location resolution:

1. explicit task/session override authorized by the user;
2. active TNF user profile in `~/.tnf/profiles/<profile>.json`;
3. TNF storage-provider defaults in `data/user-context/storage-provider-defaults.json`;
4. built-in local-safe fallback.

Repository product state, Turn Zero rails, and user personal context are different classes of state. This protocol does not relocate canonical repository doctrine into personal storage.

## Logical collections

Every provider adapter should expose the same stable collection names:

- `profile` — user-selected preferences and profile metadata;
- `sources` — user-approved durable source documents and indexes;
- `memory` — user-scoped durable semantic/episodic memory;
- `working` — bounded task/session working material;
- `receipts` — retrieval, synchronization, and provenance receipts;
- `exports` — user-requested generated artifacts.

Agents should refer to these logical collections rather than inventing raw paths.

## Profile contract

A TNF user profile may contain:

```json
{
  "contextStorage": {
    "strategy": "local-primary",
    "local": {
      "root": "~/.tnf/user-context/data/<profile>"
    },
    "googleDrive": {
      "enabled": false,
      "folderId": null,
      "folderUrl": null,
      "folderName": "TNF User Context"
    },
    "inheritance": {
      "coreFleet": "inherit-user-profile",
      "swarm": "inherit-parent",
      "agent": "inherit-parent"
    }
  }
}
```

Supported strategies in v0.1:

- `local-primary` — local is authoritative; Drive may mirror when bound;
- `google-drive-primary` — Drive is authoritative; local is a cache/working layer;
- `mirrored` — both providers are intended durable replicas, with conflict receipts required;
- `local-only` — no cloud provider is used.

An unbound Google Drive provider is **unavailable**, not implicitly authorized.

## Scope inheritance

The core fleet inherits the active user's storage profile by default for user-context work. A child swarm inherits its parent scope unless explicitly given an authorized override. An agent inherits its swarm/user profile unless explicitly given an authorized override.

Overrides must be scoped and receipt-bearing. A provider being technically available does not grant authority to ingest arbitrary user files.

## Local layout

The product-neutral local default is:

```text
~/.tnf/user-context/data/<profile>/
  profile/
  sources/
  memory/
  working/
  receipts/
  exports/
```

The actual resolved location must come from the resolver, not from copied documentation text.

## Google Drive layout

The user chooses or authorizes a Drive root. TNF stores the binding in the user's profile. Under that root, adapters should preserve the same logical collection names.

Example display layout:

```text
TNF User Context/
  <profile>/
    profile/
    sources/
    memory/
    working/
    receipts/
    exports/
```

Core source must never contain a real user's Drive folder ID or OAuth refresh token.

## Retrieval and hydration receipts

When consequential work relies on personal/user context, the consuming actor should record at minimum:

- profile name;
- logical collection;
- provider used;
- provider object/path reference;
- observation/retrieval time;
- provider revision marker when available (`modifiedTime`, ETag, content hash, etc.);
- sensitivity/classification;
- consumer identity/scope;
- whether the read was authoritative, mirrored, cached, or fallback.

If two durable replicas disagree, report conflict instead of silently choosing whichever copy was read first.

## Privacy and product-boundary rule

Personal data remains `external` / user-controlled unless explicitly transformed into a sanitized product artifact under Turn Zero classification.

`USER.md`, private memory, source documents, legal/medical/financial materials, Drive content, and local personal vaults must not become public product source merely because an agent can access them.

## Google Drive integration rule

Google Drive access is a **capability provider**, not the authority for where user context belongs. The active TNF profile supplies the Drive binding; the Drive adapter performs authorized read/write operations against that binding.

Provider-specific MCP configuration may implement the capability but must not become the canonical user-context registry.

## Website and local-runtime rule

- Local TNF may use filesystem-backed local storage directly and user-authorized Drive OAuth.
- `thenewfuse.com` must use the same logical profile contract, but provider credentials/tokens must remain in private server/user credential storage rather than public repository state.
- Browser sessions must not pretend they can write arbitrary local filesystem paths without an authorized local bridge.

## Resolver

Use the shared resolver rather than manually reconstructing paths:

```bash
node scripts/user-context/resolve-storage.cjs --json
```

The resolver reads the active TNF profile, applies defaults, expands local paths, and reports provider readiness without making network calls.

## Verification targets

- No distributed source contains operator-specific Drive IDs or personal absolute paths.
- Core fleet documentation points to this protocol/resolver instead of provider-specific context registries.
- User onboarding records a storage strategy.
- Google Drive UI does not claim successful installation/authentication unless the backend actually performed it.
- Child swarms/agents inherit the active profile unless a scoped override is present.

## Relationship to other rails

- `TURN_ZERO_MANDATE.md` governs authority/classification.
- `FRONTLOAD_MANIFEST.md` governs protocol/context hydration.
- `MEMORY.md` describes one legacy/local curated memory surface.
- `USER.md` is a private operator/profile projection, not a universal multi-user store.
- `HARNESS_CONFIG.md` governs harness capability topology, not user-data ownership.
