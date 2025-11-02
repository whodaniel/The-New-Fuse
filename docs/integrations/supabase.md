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
