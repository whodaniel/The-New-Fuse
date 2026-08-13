-- Pin search_path for private TNF helper functions to satisfy security lints.

BEGIN;

CREATE OR REPLACE FUNCTION private.tnf_current_tenant_id()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = auth, pg_catalog
AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() ->> 'tenantId', ''),
    NULLIF(auth.jwt() ->> 'tenant_id', ''),
    NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenantId', ''),
    NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')
  );
$$;

CREATE OR REPLACE FUNCTION private.tnf_tenant_visible(row_tenant_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = private, auth, pg_catalog
AS $$
  SELECT CASE
    WHEN private.tnf_current_tenant_id() IS NULL THEN row_tenant_id IS NULL
    ELSE row_tenant_id IS NULL OR row_tenant_id = private.tnf_current_tenant_id()
  END;
$$;

REVOKE ALL ON FUNCTION private.tnf_current_tenant_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.tnf_tenant_visible(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.tnf_current_tenant_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.tnf_tenant_visible(text) TO authenticated, service_role;

COMMIT;
