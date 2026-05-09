-- Phase 8 hardening for residual `extension_in_public` advisor warning.
-- Moves pgvector extension objects from `public` to `extensions` and updates
-- app-level vector search function search_path/type references accordingly.

BEGIN;

CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
DECLARE
  current_schema text;
BEGIN
  SELECT n.nspname
  INTO current_schema
  FROM pg_extension e
  JOIN pg_namespace n
    ON n.oid = e.extnamespace
  WHERE e.extname = 'vector';

  IF current_schema IS NULL THEN
    RAISE EXCEPTION 'vector extension is not installed';
  END IF;

  IF current_schema <> 'extensions' THEN
    EXECUTE 'ALTER EXTENSION vector SET SCHEMA extensions';
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding extensions.vector,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 10,
  filter_namespace text DEFAULT NULL::text
)
RETURNS TABLE(id text, content text, metadata jsonb, similarity double precision)
LANGUAGE sql
STABLE
SET search_path = public, extensions, pg_catalog
AS $$
  SELECT
    vector_embeddings.id,
    vector_embeddings.content,
    vector_embeddings.metadata,
    1 - (vector_embeddings.embedding <=> query_embedding) AS similarity
  FROM vector_embeddings
  WHERE
    (filter_namespace IS NULL OR vector_embeddings.namespace = filter_namespace)
    AND 1 - (vector_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY vector_embeddings.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMIT;
