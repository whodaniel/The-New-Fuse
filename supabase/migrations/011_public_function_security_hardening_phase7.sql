-- Phase 7 hardening for remaining public-function security advisor warnings.
-- - Removes public SECURITY DEFINER exposure for agent session access helpers.
-- - Pins search_path for legacy public helper functions.

BEGIN;

CREATE OR REPLACE FUNCTION public.agent_has_story_session_read_access(target_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, auth, pg_catalog
AS $$
  SELECT public.current_agent_id() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.story_session_agent_access g
      WHERE g.session_id = target_session_id
        AND g.agent_id = public.current_agent_id()
        AND g.can_read = true
        AND g.revoked_at IS NULL
    );
$$;

CREATE OR REPLACE FUNCTION public.agent_has_story_session_write_access(target_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, auth, pg_catalog
AS $$
  SELECT public.current_agent_id() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.story_session_agent_access g
      WHERE g.session_id = target_session_id
        AND g.agent_id = public.current_agent_id()
        AND g.can_write = true
        AND g.revoked_at IS NULL
    );
$$;

CREATE OR REPLACE FUNCTION public.current_request_role()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = auth, pg_catalog
AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() ->> 'role', ''),
    NULLIF(current_setting('request.jwt.claim.role', true), '')
  );
$$;

CREATE OR REPLACE FUNCTION public.current_owner_principal_id()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public, auth, pg_catalog
AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() ->> 'owner_principal_id', ''),
    CASE
      WHEN public.current_request_role() = 'service_role'
      THEN NULLIF((current_setting('request.headers', true)::json ->> 'x-owner-principal-id'), '')
      ELSE NULL
    END
  );
$$;

CREATE OR REPLACE FUNCTION public.current_agent_id()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public, auth, pg_catalog
AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() ->> 'agent_id', ''),
    CASE
      WHEN public.current_request_role() = 'service_role'
      THEN NULLIF((current_setting('request.headers', true)::json ->> 'x-agent-id'), '')
      ELSE NULL
    END
  );
$$;

CREATE OR REPLACE FUNCTION public.has_collective_scope()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, auth, pg_catalog
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'knowledge_scope',
    CASE
      WHEN public.current_request_role() = 'service_role'
      THEN current_setting('request.headers', true)::json ->> 'x-knowledge-scope'
      ELSE NULL
    END,
    ''
  ) IN ('collective', 'public');
$$;

CREATE OR REPLACE FUNCTION public.can_read_story_session(target_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, auth, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM story_sessions s
    WHERE s.id = target_session_id
      AND (
        auth.uid() = s.user_id
        OR (public.current_owner_principal_id() IS NOT NULL AND s.owner_principal_id = public.current_owner_principal_id())
        OR public.agent_has_story_session_read_access(s.id)
        OR (s.visibility_scope = 'public' AND s.release_state = 'released_public')
        OR (
          s.visibility_scope = 'collective'
          AND s.release_state = 'released_collective'
          AND public.has_collective_scope()
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_write_story_session(target_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, auth, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM story_sessions s
    WHERE s.id = target_session_id
      AND (
        auth.uid() = s.user_id
        OR (public.current_owner_principal_id() IS NOT NULL AND s.owner_principal_id = public.current_owner_principal_id())
        OR public.agent_has_story_session_write_access(s.id)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 10,
  filter_namespace text DEFAULT NULL::text
)
RETURNS TABLE(id text, content text, metadata jsonb, similarity double precision)
LANGUAGE sql
STABLE
SET search_path = public, pg_catalog
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

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMIT;
