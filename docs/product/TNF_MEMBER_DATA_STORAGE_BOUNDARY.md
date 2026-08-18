# TNF Member Data Storage Boundary

> Status: Active product doctrine
>
> Purpose: Prevent TNF from becoming an unbounded member cloud drive while
> keeping the hosted SaaS competitive for document-aware agent workflows.

## Decision

TNF should store product state, metadata, indexes, lightweight generated
artifacts, and references to member-owned files. TNF should not store unlimited
member documents, media libraries, archives, backups, or synchronized cloud
drive mirrors.

The machine-readable policy is
`data/product/member-storage-policy.json`. The current direct upload ceiling is
10 MB. Larger files should be saved in connected storage such as Google Drive,
Dropbox, Box, OneDrive, or customer-owned S3/R2, then attached to TNF as a link
for indexing, summarization, or agent context.

The companion registry is
`docs/product/TNF_PERSONAL_DATA_LOCATION_REGISTRY.md`, backed by
`data/product/personal-data-location-policy.json` and the
`user_data_locations` table. That registry is how TNF remembers where a user's
durable files live without hosting or mirroring those files.

## Why

Supabase is a strong product database and storage layer, but its economics are
not the same as a dedicated consumer cloud drive. Supabase Pro includes finite
database and file storage with metered overage; Storage also supports very large
file limits, which means the application must set smaller product limits on its
own buckets and upload flows.

Competitive SaaS products make this boundary explicit:

- Slack limits history/retention by plan and gives paid plans custom retention
  controls for messages and files:
  <https://slack.com/help/articles/115003205446-Slack-plans-and-features>.
- Notion sells unlimited uploads on paid plans, but still communicates per-file
  limits and external app connections:
  <https://www.notion.com/pricing>.
- Airtable caps attachment storage by base and plan:
  <https://support.airtable.com/docs/attachment-field>.
- Asana advertises unlimited storage but caps each file at 100 MB:
  <https://asana.com/pricing> and
  <https://developers.asana.com/reference/createattachmentforobject>.
- Google Drive and Dropbox are purpose-built file storage products with much
  larger file limits and storage-account semantics:
  <https://knowledge.workspace.google.com/admin/drive/storage-and-upload-limits-for-google-workspace>
  and <https://help.dropbox.com/sync/upload-limitations>.

Supabase source anchors:

- <https://supabase.com/pricing>
- <https://supabase.com/docs/guides/platform/manage-your-usage/storage-size>
- <https://supabase.com/docs/guides/storage/uploads/file-limits>

TNF should compete by being excellent at agent context, indexing, summaries,
workflows, provenance, and connected-file orchestration. It should not compete
by subsidizing arbitrary binary storage inside the SaaS database.

## What Supabase May Store

Allowed in Supabase/Postgres:

- Account, membership, workspace, project, billing, and entitlement state.
- Lightweight notes, prompts, workflow configs, project settings, and small
  generated text artifacts.
- External file references: provider, URL or provider file ID, MIME type, size,
  ownership, permission state, last indexed time, content hash, and provenance.
- Extracted text, summaries, vector embeddings, thumbnails, and previews that
  are bounded by policy and retention.
- Audit logs with explicit retention windows.

Allowed in Supabase Storage or another platform-owned object store only when
quota-bound:

- Small direct uploads under the policy limit.
- Temporary processing artifacts.
- Avatars, thumbnails, small screenshots, and generated previews.
- Enterprise contracted storage buckets with explicit terms.

## What Supabase Must Not Store By Default

Do not use Supabase as:

- A user cloud drive.
- A media library for raw video, audio, or image collections.
- A backup destination for member devices.
- A mirror of Google Drive, Dropbox, Box, OneDrive, iCloud, or local folders.
- A place for large PDFs, ZIPs, exported datasets, or generated archives unless
  covered by a specific enterprise storage contract.

## Product Flow

When a member uploads or attaches a file:

1. If it is under the direct upload limit and type policy, accept it as a
   hosted working-set artifact.
2. If it is larger, prompt the member to save it in connected storage and attach
   a link.
3. Store only the external reference, permission metadata, content hash,
   extracted text, summary, and vector index in TNF.
4. Show quota usage before failure: normal, near-limit, exceeded.
5. Provide export and deletion controls for hosted artifacts and indexes.
6. Make enterprise storage a contract feature, not an accidental overage path.

## Plan Policy

| Plan | Direct upload | Hosted retained working set | Larger files |
| --- | --- | --- | --- |
| STARTER | 10 MB per file | 100 MB | External storage link required |
| PRO | 10 MB per file | 1 GB | External storage link required |
| ENTERPRISE | 10 MB default, negotiable | Custom contract | Customer storage or contracted bucket |

The hosted retained working set is for small artifacts and generated outputs,
not durable user file storage.

## Implementation Requirements

- Backend upload endpoints must use the policy constant, not scattered literals.
- Billing and entitlement state must expose storage tier and usage.
- Workspace/project tables should store external file references instead of raw
  document bodies for member uploads.
- User, workspace, and project flows should write `user_data_locations` records
  for consented durable storage roots such as Google Drive folders or private
  repositories.
- Any future Supabase Storage bucket must set per-bucket size/type limits below
  the Supabase global maximum.
- Public UX must say where durable docs/media should be saved before upload
  failure happens.
- Release gates must check that the docs, machine-readable policy, and upload
  code agree.

## Current Gaps

- `project_documents.content` stores full text and should be treated as small
  text/extract storage only until a migration separates external references
  from extracted/indexed content.
- `usage_records` tracks `VECTOR_STORAGE_MB` but not hosted file bytes yet.
- The backend file module is still a mock/in-memory implementation; it now
  carries policy messaging, but retained-storage accounting still needs a real
  repository-backed implementation.
