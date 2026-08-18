# TNF Personal Data Location Registry

> Status: Active product architecture
>
> Purpose: Let TNF remember where each user's personal and business data lives
> without turning TNF, Supabase, or the open-source repo into a cloud drive.

## Decision

TNF needs a first-class registry of user data locations. A location is a
consented pointer to a durable storage place such as Google Drive, Dropbox, Box,
OneDrive, customer-owned S3/R2, a private GitHub repository, a local device
reference, or another URL.

The machine-readable policy is
`data/product/personal-data-location-policy.json`. Google Drive is the default
preferred provider for personal user business artifacts, but the product must
stay provider-neutral so teams can bring their own storage.

The registry stores metadata and permission state only. It must not store OAuth
tokens, raw file bytes, full private paths without user consent, or mirrors of
an entire drive.

## What TNF Remembers

For each user, workspace, or project, TNF may remember:

- Provider and account label.
- External provider folder/file ID or redacted URL.
- A user-approved path hint such as `Client Work/Reports`.
- Location kind: document library, media library, exports, backups, project
  assets, generated outputs, client artifacts, or personal business artifacts.
- Data classification and retention policy.
- Consent status and sync status.
- Last indexed and last verified timestamps.
- Hash, provenance, and derived-index metadata.
- An encrypted secret-store reference, never the secret itself.

## What TNF Does Not Remember

The registry must not contain:

- OAuth access tokens or refresh tokens.
- Raw file bytes or unbounded file content.
- Unredacted credentials.
- Full private filesystem paths unless the user explicitly approves that exact
  path for display/storage.
- A mirrored listing of a whole Google Drive, Dropbox, Box, OneDrive, iCloud, or
  local disk.

Tokens belong in an encrypted server-side secret store or provider OAuth system.
The registry can keep a secret reference ID so application code can ask the
secret store for credentials when the user has active consent.

## Product Flow

1. During onboarding or the first oversized upload, ask where durable docs and
   media should live. Default the recommendation to Google Drive for individual
   users.
2. Store a location card with provider, account label, location kind, consent
   status, sync status, and last verification timestamps.
3. When a user attaches a document or media asset, store the provider ID or URL,
   plus bounded extracts, summaries, thumbnails, vectors, and provenance.
4. If a provider disconnects or consent is revoked, mark the location
   `reauth_required`, `disconnected`, or `revoked` and stop indexing.
5. On delete, remove the registry row and derived TNF indexes. Do not delete the
   user's source files unless a provider-specific delete command is explicitly
   requested and confirmed.

## Supabase Boundary

Supabase may store the registry row, bounded extracts, summaries, embeddings,
previews, and audit events. Supabase must not be used as the durable store for
the underlying docs, media libraries, backups, archives, or synchronized drive
mirrors.

This registry is the product answer to the member-storage boundary in
`docs/product/TNF_MEMBER_DATA_STORAGE_BOUNDARY.md`: TNF knows where the data is,
can orchestrate agent context around it, and can prove consent/status without
subsidizing arbitrary file storage.

## Database Contract

The registry table is `user_data_locations`.

Required properties:

- Owned by `user_id`; optionally scoped to `workspace_id` and `project_id`.
- Provider and location kind are enums so unsupported integrations are visible.
- Consent and sync status are explicit fields.
- `oauth_secret_ref` is only an opaque secret-store reference.
- `external_url` and `root_path_hint` are user-approved display/pointer fields,
  not scrape targets for broad drive mirroring.
- Indexes support common lookups by user, workspace, project, provider, status,
  and verification freshness.

## Implementation Requirements

- Public UX must show where durable docs/media live before upload failure.
- Workspace/project file flows must store external references for larger member
  files instead of raw bodies.
- Provider integrations must write or update a registry row when the user
  connects storage.
- Provider disconnect/revocation must update registry status before future sync
  work is accepted.
- Release gates must ensure docs, policy, database schema, and migrations agree
  on the registry boundary.
