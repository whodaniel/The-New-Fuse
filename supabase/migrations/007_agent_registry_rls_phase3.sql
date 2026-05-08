-- Phase 3 RLS rollout for agent-registry and registration-linked tables.
-- Adds ownership helper functions and applies deterministic owner policies.

BEGIN;

CREATE OR REPLACE FUNCTION private.tnf_agent_owned(target_agent_id uuid)
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
      FROM public.agents a
      WHERE a.id = target_agent_id
        AND a.user_id::text = (SELECT auth.uid())::text
    );
$$;

CREATE OR REPLACE FUNCTION private.tnf_registration_owned(target_registration_id uuid)
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
      FROM public.agent_registrations ar
      JOIN public.agents a
        ON a.id = ar.agent_id
      WHERE ar.id = target_registration_id
        AND a.user_id::text = (SELECT auth.uid())::text
    );
$$;

REVOKE ALL ON FUNCTION private.tnf_agent_owned(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.tnf_registration_owned(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.tnf_agent_owned(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.tnf_registration_owned(uuid) TO authenticated, service_role;

DO $$
DECLARE
  rec RECORD;
  policy_prefix text;
  condition_expr text;
BEGIN
  FOR rec IN
    SELECT *
    FROM (
      VALUES
        ('agent_registrations'::text, 'agent_id'::text, 'agent'::text),
        ('agent_directory_entries'::text, 'agent_id'::text, 'agent'::text),
        ('agent_metadata'::text, 'agent_id'::text, 'agent'::text),
        ('agent_nfts'::text, 'agent_id'::text, 'agent'::text),
        ('agent_prompt_versions'::text, 'agent_id'::text, 'agent'::text),
        ('agent_capability_registry'::text, 'registration_id'::text, 'registration'::text),
        ('agent_metrics'::text, 'registration_id'::text, 'registration'::text),
        ('agent_onboarding_events'::text, 'registration_id'::text, 'registration'::text)
    ) AS t(table_name, owner_column, owner_kind)
  LOOP
    IF to_regclass(format('public.%I', rec.table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = rec.table_name
        AND c.column_name = rec.owner_column
    ) THEN
      CONTINUE;
    END IF;

    policy_prefix := format('tnf_%s_%s', rec.table_name, rec.owner_kind);

    IF rec.owner_kind = 'agent' THEN
      condition_expr := format('private.tnf_agent_owned(%I)', rec.owner_column);
    ELSE
      condition_expr := format('private.tnf_registration_owned(%I)', rec.owner_column);
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', rec.table_name);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_prefix || '_select', rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (%s)',
      policy_prefix || '_select',
      rec.table_name,
      condition_expr
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_prefix || '_insert', rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)',
      policy_prefix || '_insert',
      rec.table_name,
      condition_expr
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_prefix || '_update', rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)',
      policy_prefix || '_update',
      rec.table_name,
      condition_expr,
      condition_expr
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_prefix || '_delete', rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%s)',
      policy_prefix || '_delete',
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
