# Supabase Integration Guide for The New Fuse

## Overview

This guide covers the complete Supabase integration in The New Fuse framework,
including setup, configuration, and usage patterns for both vector database
operations and general database/storage operations.

## Table of Contents

1. [Configuration](#configuration)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Services Overview](#services-overview)
5. [Usage Examples](#usage-examples)
6. [Agent Integration](#agent-integration)
7. [Troubleshooting](#troubleshooting)

---

## Configuration

### Environment Variables

Add the following variables to your `.env` file (see `.env.example` for
reference):

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
SUPABASE_JWT_SECRET=your-supabase-jwt-secret-here
SUPABASE_PROJECT_REF=your-project-ref
```

**Where to find these values:**

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the values:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
   - **JWT Secret** → `SUPABASE_JWT_SECRET`

---

## Installation

The Supabase dependency has been added to the root `package.json`:

```bash
# Install dependencies
pnpm install

# This will install @supabase/supabase-js v2.49.2
```

---

## Database Setup

### 1. Enable pgvector Extension

The integration uses Supabase's `pgvector` extension for vector similarity
search.

**To enable in your Supabase project:**

1. Go to Database → Extensions in your Supabase dashboard
2. Search for "vector"
3. Enable the `vector` extension

### 2. Run Migrations

Execute the SQL migration file located at:

```
/supabase/migrations/001_create_vector_embeddings.sql
```

**How to run:**

#### Option A: Using Supabase Dashboard (SQL Editor)

1. Go to SQL Editor in your Supabase dashboard
2. Create a new query
3. Copy and paste the contents of `001_create_vector_embeddings.sql`
4. Click "Run"

#### Option B: Using Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push

# Or apply migration directly
supabase db execute --file supabase/migrations/001_create_vector_embeddings.sql
```

### 3. Verify Setup

Run this query in your SQL Editor to verify the table was created:

```sql
SELECT * FROM vector_embeddings LIMIT 1;
```

---

## Services Overview

### 1. VectorDatabaseService

**Location:** `packages/core/src/rag/VectorDatabaseService.ts`

**Purpose:** Handles vector embeddings for RAG (Retrieval-Augmented Generation)
and semantic search operations.

**Features:**

- Store vector embeddings with metadata
- Similarity search using cosine distance
- Namespace support for multi-tenant data
- Support for multiple vector DB providers (Supabase, Pinecone, Chroma, etc.)

**Key Methods:**

- `storeEmbedding(id, embedding, content, metadata)` - Store a vector embedding
- `similaritySearch(queryEmbedding, limit, threshold)` - Find similar vectors
- `deleteEmbedding(id)` - Delete an embedding
- `clearNamespace()` - Clear all embeddings in current namespace

### 2. SupabaseService

**Location:** `packages/core/src/services/SupabaseService.ts`

**Purpose:** General-purpose Supabase client for CRUD operations, real-time
subscriptions, and storage.

**Features:**

- Full CRUD operations (Create, Read, Update, Delete)
- Query builder with filtering, ordering, and pagination
- Real-time subscriptions
- File storage operations
- RPC function execution

**Key Methods:**

- `query(table, options)` - Query data with filters
- `insert(table, data)` - Insert data
- `update(table, data, filter)` - Update data
- `delete(table, filter)` - Delete data
- `rpc(functionName, params)` - Execute stored procedures
- `subscribeToTable(table, callback)` - Real-time subscriptions
- `uploadFile(bucket, path, file)` - Upload to storage
- `downloadFile(bucket, path)` - Download from storage

---

## Usage Examples

### Vector Database Operations

```typescript
import { VectorDatabaseService } from '@the-new-fuse/core/rag/VectorDatabaseService';

// Inject the service (NestJS example)
constructor(private vectorDb: VectorDatabaseService) {}

// Store an embedding
await this.vectorDb.storeEmbedding(
  'doc-123',
  [0.1, 0.2, 0.3, ...], // 1536-dimensional vector
  'This is the document content',
  { source: 'documentation', type: 'technical' }
);

// Perform similarity search
const results = await this.vectorDb.similaritySearch(
  queryEmbedding,
  10,  // limit
  0.7  // similarity threshold
);

results.forEach(result => {
  console.log(`${result.id}: ${result.score} - ${result.content}`);
});
```

### General Database Operations

```typescript
import { SupabaseService } from '@the-new-fuse/core/services/SupabaseService';

// Inject the service
constructor(private supabase: SupabaseService) {}

// Query with filters
const { data, error } = await this.supabase.query('agents', {
  select: 'id, name, status',
  filter: { status: 'active' },
  order: { column: 'created_at', ascending: false },
  limit: 10
});

// Insert data
await this.supabase.insert('tasks', {
  title: 'New Task',
  description: 'Task description',
  status: 'pending'
});

// Update data
await this.supabase.update(
  'tasks',
  { status: 'completed' },
  { id: 'task-123' }
);

// Real-time subscription
const unsubscribe = this.supabase.subscribeToTable(
  'tasks',
  (payload) => {
    console.log('Change received!', payload);
  },
  { user_id: 'user-123' } // optional filter
);

// Later: unsubscribe()
```

### File Storage Operations

```typescript
// Upload a file
const { data, error } = await this.supabase.uploadFile(
  'documents', // bucket name
  'folder/file.pdf', // path
  fileBuffer,
  { contentType: 'application/pdf', upsert: true }
);

// Get public URL
const publicUrl = this.supabase.getPublicUrl('documents', 'folder/file.pdf');

// Download a file
const { data: fileData } = await this.supabase.downloadFile(
  'documents',
  'folder/file.pdf'
);
```

---

## Agent Integration

### Enabling Supabase for Agents

Agents can be configured to use Supabase through the agent metadata system:

```json
{
  "name": "Data Analysis Agent",
  "capabilities": ["API_INTEGRATION", "SUPABASE_INTEGRATION", "DATA_ANALYSIS"],
  "tools": ["SUPABASE"],
  "configuration": {
    "supabase": {
      "enabled": true,
      "allowedTables": ["tasks", "documents", "analytics"],
      "allowVectorOperations": true
    }
  }
}
```

### Agent Tool Types

The Supabase integration is available as:

- **Capability:** `AgentCapability.SUPABASE_INTEGRATION`
- **Tool:** `AgentToolType.SUPABASE`

**UI Integration:** Agents can be configured with Supabase access through the
AgentToolsForm component located at:

```
apps/frontend/src/components/forms/AgentToolsForm.tsx
```

---

## Troubleshooting

### Common Issues

#### 1. "Supabase client is not initialized"

**Cause:** Missing or invalid environment variables.

**Solution:**

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_ANON_KEY`)
  are set in your `.env` file
- Restart your application after adding environment variables

#### 2. "Failed to store embedding: relation 'vector_embeddings' does not exist"

**Cause:** Database migration not run.

**Solution:**

- Run the SQL migration file `001_create_vector_embeddings.sql` in your Supabase
  SQL Editor
- Verify the table exists: `SELECT * FROM vector_embeddings LIMIT 1;`

#### 3. "pgvector extension not found"

**Cause:** The vector extension is not enabled in your Supabase project.

**Solution:**

- Go to Database → Extensions in Supabase dashboard
- Enable the `vector` extension

#### 4. "Permission denied" errors

**Cause:** Row Level Security (RLS) policies may be blocking access.

**Solution:**

- Use `SUPABASE_SERVICE_ROLE_KEY` instead of `SUPABASE_ANON_KEY` for backend
  operations
- Or adjust RLS policies in the migration file to match your authentication
  setup

#### 5. Vector similarity search returns no results

**Cause:**

- Incorrect embedding dimensions
- Threshold too high
- No embeddings in the namespace

**Solution:**

- Verify embeddings are 1536 dimensions (for OpenAI models)
- Lower the similarity threshold (try 0.5 instead of 0.7)
- Check namespace:
  `SELECT COUNT(*) FROM vector_embeddings WHERE namespace = 'your-namespace';`

---

## Advanced Configuration

### Custom Embedding Dimensions

If using a different embedding model, adjust the dimension in the migration
file:

```sql
-- Change from 1536 to your model's dimension
CREATE TABLE vector_embeddings (
    ...
    embedding vector(768),  -- Example: 768 for some models
    ...
);
```

Don't forget to update the `match_documents` function parameter as well.

### Custom Namespaces

Namespaces allow multi-tenant data isolation:

```typescript
// In your .env
VECTOR_DB_NAMESPACE = my - custom - namespace;

// Or set per-operation
await vectorDb.storeEmbedding(id, embedding, content, metadata);
```

### Performance Optimization

For large datasets, consider:

1. **Use HNSW index** (already in migration) for faster searches
2. **Batch operations** when inserting multiple embeddings
3. **Implement caching** for frequently accessed data
4. **Use connection pooling** (handled by Supabase)

---

## Migration from Bun to PNPM

The project has been migrated from Bun to PNPM. All references to `bun` commands
have been replaced with `pnpm` equivalents:

- `bun install` → `pnpm install`
- `bun run` → `pnpm run`
- `bun add` → `pnpm add`
- `bunx` → `pnpm dlx`

The `pnpm-workspace.yaml` file has been created to support the monorepo
structure.

---

## Next Steps

1. **Run `pnpm install`** to install the Supabase SDK
2. **Configure your `.env`** file with Supabase credentials
3. **Run the database migration** to create the vector_embeddings table
4. **Test the integration** using the examples above
5. **Configure agents** to use Supabase capabilities

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [The New Fuse Agent Metadata Schema](./agents-and-protocols/agent_metadata_schema.md)

---

**For questions or issues, please check the troubleshooting section or consult
the team.**
