-- Phase 4 RLS rollout for project/workflow scoped tables.
-- Uses workspace/project/workflow ownership helpers for deterministic gating.

BEGIN;

CREATE OR REPLACE FUNCTION private.tnf_project_visible(target_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = target_project_id
        AND private.tnf_workspace_member_or_owner(p.workspace_id::text)
    );
$$;

CREATE OR REPLACE FUNCTION private.tnf_workflow_owned(target_workflow_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.workflows w
      WHERE w.id = target_workflow_id
        AND w.creator_id::text = (SELECT auth.uid())::text
    );
$$;

REVOKE ALL ON FUNCTION private.tnf_project_visible(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.tnf_workflow_owned(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.tnf_project_visible(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.tnf_workflow_owned(uuid) TO authenticated, service_role;

DO $$
DECLARE
  rec RECORD;
  condition_expr text;
  policy_base text;
BEGIN
  FOR rec IN
    SELECT *
    FROM (
      VALUES
        ('projects'::text, 'private.tnf_workspace_member_or_owner(workspace_id::text)'::text),
        ('resource_allocations'::text, 'private.tnf_project_visible(project_id)'::text),
        (
          'workflow_executions'::text,
          '((project_id IS NOT NULL AND private.tnf_project_visible(project_id)) OR private.tnf_workflow_owned(workflow_id))'::text
        ),
        (
          'workflow_steps'::text,
          '(private.tnf_workflow_owned(workflow_id) OR (agent_id IS NOT NULL AND private.tnf_agent_owned(agent_id)))'::text
        )
    ) AS t(table_name, condition_expr)
  LOOP
    IF to_regclass(format('public.%I', rec.table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    condition_expr := rec.condition_expr;
    policy_base := format('tnf_%s', rec.table_name);

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', rec.table_name);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_base || '_select', rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (%s)',
      policy_base || '_select',
      rec.table_name,
      condition_expr
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_base || '_insert', rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)',
      policy_base || '_insert',
      rec.table_name,
      condition_expr
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_base || '_update', rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)',
      policy_base || '_update',
      rec.table_name,
      condition_expr,
      condition_expr
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_base || '_delete', rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%s)',
      policy_base || '_delete',
      rec.table_name,
      condition_expr
    );

    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated, service_role',
      rec.table_name
    );
  END LOOP;
END
$$;

COMMIT;
