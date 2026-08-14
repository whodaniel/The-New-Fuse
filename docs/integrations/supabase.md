# Supabase Integration

This document outlines how to set up and use the Supabase integration for The New Fuse framework.

## Setup

1.  **Install the Supabase client library:**

    ```bash
    pnpm add @supabase/supabase-js -w
    ```

2.  **Add environment variables:**

    Add the following variables to your `.env.development` and `.env.example` files:

    ```
    SUPABASE_URL="YOUR_SUPABASE_URL"
    SUPABASE_KEY="YOUR_SUPABASE_ANON_KEY"
    ```

## Usage

The `SupabaseService` provides a set of methods for interacting with your Supabase project. You can use it to perform database operations and subscribe to real-time changes.

### Available Tools

The following tools are available for agents to use:

*   `supabase_query`: Query a Supabase table
*   `supabase_insert`: Insert a new row into a Supabase table
*   `supabase_update`: Update rows in a Supabase table
*   `supabase_delete`: Delete rows from a Supabase table

## Member Data Boundary

Supabase is not a member cloud drive for TNF. Use it for account state,
membership and entitlement state, workspace/project metadata, lightweight text
artifacts, extracted document text, embeddings, indexes, audit logs with
retention, and references to member-owned files in external storage.

Do not store raw media libraries, large documents, ZIP archives, user device
backups, or mirrors of Google Drive/Dropbox/Box/OneDrive in Supabase by
default. Larger docs and media should remain in user-connected storage, with TNF
storing provider metadata, links, content hashes, summaries, extracts, and
vector indexes.

Use `user_data_locations` for durable storage roots. That table may store the
provider, account label, external location ID or redacted URL, consent status,
sync status, verification timestamps, and an opaque `oauth_secret_ref`. It must
not store OAuth access tokens, refresh tokens, raw file bytes, or entire drive
mirrors.

Canonical policy:

- `docs/product/TNF_MEMBER_DATA_STORAGE_BOUNDARY.md`
- `docs/product/TNF_PERSONAL_DATA_LOCATION_REGISTRY.md`
- `data/product/member-storage-policy.json`
- `data/product/personal-data-location-policy.json`
