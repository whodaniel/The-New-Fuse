-- Tenant/workspace RLS guardrails for task domain tables.
-- This migration is schema-compatible across environments where tenant/workspace
-- columns may not yet exist. It always enforces user ownership at minimum.

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.tnf_current_tenant_id()
RETURNS text
LANGUAGE sql
STABLE
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
AS $$
  SELECT CASE
    WHEN private.tnf_current_tenant_id() IS NULL THEN row_tenant_id IS NULL
    ELSE row_tenant_id IS NULL OR row_tenant_id = private.tnf_current_tenant_id()
  END;
$$;

CREATE OR REPLACE FUNCTION private.tnf_workspace_member_or_owner(target_workspace_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  uid_text text := (SELECT auth.uid())::text;
  is_member boolean := false;
BEGIN
  IF target_workspace_id IS NULL THEN
    RETURN true;
  END IF;

  IF uid_text IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.workspaces w
    WHERE w.id::text = target_workspace_id
      AND w.owner_id::text = uid_text
  ) THEN
    RETURN true;
  END IF;

  IF to_regclass('public.workspace_members') IS NOT NULL THEN
    EXECUTE '
      SELECT EXISTS (
        SELECT 1
        FROM public.workspace_members wm
        WHERE wm.workspace_id::text = $1
          AND wm.user_id::text = $2
      )
    '
      INTO is_member
      USING target_workspace_id, uid_text;

    IF is_member THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION private.tnf_current_tenant_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.tnf_tenant_visible(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.tnf_workspace_member_or_owner(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.tnf_current_tenant_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.tnf_tenant_visible(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.tnf_workspace_member_or_owner(text) TO authenticated, service_role;

DO $$
DECLARE
  has_user_id boolean;
  has_tenant_id boolean;
  has_workspace_id boolean;
  using_expr text;
BEGIN
  IF to_regclass('public.pipelines') IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'pipelines' AND column_name = 'user_id'
    ),
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'pipelines' AND column_name = 'tenant_id'
    ),
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'pipelines' AND column_name = 'workspace_id'
    )
    INTO has_user_id, has_tenant_id, has_workspace_id;

  IF NOT has_user_id THEN
    RETURN;
  END IF;

  using_expr := '(SELECT auth.uid()) IS NOT NULL AND user_id::text = (SELECT auth.uid())::text';

  IF has_tenant_id THEN
    using_expr := using_expr || ' AND private.tnf_tenant_visible(tenant_id::text)';
  END IF;

  IF has_workspace_id THEN
    using_expr := using_expr || ' AND private.tnf_workspace_member_or_owner(workspace_id::text)';
  END IF;

  ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS pipelines_tenant_workspace_guard ON public.pipelines;

  EXECUTE format(
    'CREATE POLICY pipelines_tenant_workspace_guard ON public.pipelines FOR ALL TO authenticated USING (%1$s) WITH CHECK (%1$s)',
    using_expr
  );
END
$$;

DO $$
DECLARE
  has_user_id boolean;
  has_tenant_id boolean;
  has_workspace_id boolean;
  using_expr text;
BEGIN
  IF to_regclass('public.tasks') IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'user_id'
    ),
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'tenant_id'
    ),
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'workspace_id'
    )
    INTO has_user_id, has_tenant_id, has_workspace_id;

  IF NOT has_user_id THEN
    RETURN;
  END IF;

  using_expr := '(SELECT auth.uid()) IS NOT NULL AND user_id::text = (SELECT auth.uid())::text';

  IF has_tenant_id THEN
    using_expr := using_expr || ' AND private.tnf_tenant_visible(tenant_id::text)';
  END IF;

  IF has_workspace_id THEN
    using_expr := using_expr || ' AND private.tnf_workspace_member_or_owner(workspace_id::text)';
  END IF;

  ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS tasks_tenant_workspace_guard ON public.tasks;

  EXECUTE format(
    'CREATE POLICY tasks_tenant_workspace_guard ON public.tasks FOR ALL TO authenticated USING (%1$s) WITH CHECK (%1$s)',
    using_expr
  );
END
$$;

DO $$
DECLARE
  has_user_id boolean;
  has_tenant_id boolean;
  has_workspace_id boolean;
  has_task_id boolean;
  has_task_user_id boolean;
  has_task_tenant_id boolean;
  has_task_workspace_id boolean;
  using_expr text;
  fallback_expr text;
BEGIN
  IF to_regclass('public.task_executions') IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'task_executions' AND column_name = 'user_id'
    ),
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'task_executions' AND column_name = 'tenant_id'
    ),
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'task_executions' AND column_name = 'workspace_id'
    ),
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'task_executions' AND column_name = 'task_id'
    )
    INTO has_user_id, has_tenant_id, has_workspace_id, has_task_id;

  IF to_regclass('public.tasks') IS NOT NULL THEN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'user_id'
      ),
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'tenant_id'
      ),
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'workspace_id'
      )
      INTO has_task_user_id, has_task_tenant_id, has_task_workspace_id;
  ELSE
    has_task_user_id := false;
    has_task_tenant_id := false;
    has_task_workspace_id := false;
  END IF;

  using_expr := '(SELECT auth.uid()) IS NOT NULL';

  IF has_tenant_id THEN
    using_expr := using_expr || ' AND private.tnf_tenant_visible(tenant_id::text)';
  END IF;

  fallback_expr := 'false';

  IF has_user_id THEN
    fallback_expr := fallback_expr || ' OR user_id::text = (SELECT auth.uid())::text';
  END IF;

  IF has_workspace_id THEN
    fallback_expr := fallback_expr || ' OR private.tnf_workspace_member_or_owner(workspace_id::text)';
  END IF;

  IF has_task_id AND has_task_user_id THEN
    fallback_expr := fallback_expr
      || ' OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id'
      || ' AND t.user_id::text = (SELECT auth.uid())::text';

    IF has_task_tenant_id THEN
      fallback_expr := fallback_expr || ' AND private.tnf_tenant_visible(t.tenant_id::text)';
    END IF;

    IF has_task_workspace_id THEN
      fallback_expr := fallback_expr || ' AND private.tnf_workspace_member_or_owner(t.workspace_id::text)';
    END IF;

    fallback_expr := fallback_expr || ')';
  END IF;

  using_expr := using_expr || ' AND (' || fallback_expr || ')';

  ALTER TABLE public.task_executions ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS task_executions_tenant_workspace_guard ON public.task_executions;

  EXECUTE format(
    'CREATE POLICY task_executions_tenant_workspace_guard ON public.task_executions FOR ALL TO authenticated USING (%1$s) WITH CHECK (%1$s)',
    using_expr
  );
END
$$;

DO $$
BEGIN
  IF to_regclass('public.pipelines') IS NOT NULL THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pipelines TO authenticated, service_role;
  END IF;
  IF to_regclass('public.tasks') IS NOT NULL THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks TO authenticated, service_role;
  END IF;
  IF to_regclass('public.task_executions') IS NOT NULL THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.task_executions TO authenticated, service_role;
  END IF;
END
$$;

COMMIT;
