-- Preview hardening patch (not auto-applied in this pass).
-- Goal: prevent anon/public header spoofing for owner/agent/collective scope.

BEGIN;

CREATE OR REPLACE FUNCTION public.current_request_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() ->> 'role', ''),
    NULLIF(current_setting('request.jwt.claim.role', true), '')
  );
$$;

CREATE OR REPLACE FUNCTION public.current_owner_principal_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
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
RETURNS TEXT
LANGUAGE SQL
STABLE
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
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
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

COMMIT;
