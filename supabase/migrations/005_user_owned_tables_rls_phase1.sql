-- Phase 1 owner-scoped RLS rollout for user-owned public tables.
-- Applies deterministic self-access policies where ownership key is explicit.

BEGIN;

DO $$
DECLARE
  rec RECORD;
  policy_prefix text;
BEGIN
  FOR rec IN
    SELECT *
    FROM (
      VALUES
        ('users'::text, 'id'::text),
        ('provider_api_keys'::text, 'user_id'::text),
        ('jules_configs'::text, 'user_id'::text),
        ('jules_usage_logs'::text, 'user_id'::text),
        ('login_attempts'::text, 'user_id'::text),
        ('notifications'::text, 'user_id'::text),
        ('auth_events'::text, 'user_id'::text),
        ('auth_sessions'::text, 'user_id'::text),
        ('chat_messages'::text, 'user_id'::text),
        ('resource_favorites'::text, 'user_id'::text),
        ('workflow_topologies'::text, 'user_id'::text),
        ('optimization_jobs'::text, 'user_id'::text),
        ('agents'::text, 'user_id'::text),
        ('chats'::text, 'user_id'::text),
        ('read_receipts'::text, 'user_id'::text),
        ('jules_sessions'::text, 'user_id'::text)
    ) AS t(table_name, owner_column)
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

    policy_prefix := format('tnf_%s_self', rec.table_name);

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', rec.table_name);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_prefix || '_select', rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL AND %I::text = (SELECT auth.uid())::text)',
      policy_prefix || '_select',
      rec.table_name,
      rec.owner_column
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_prefix || '_insert', rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND %I::text = (SELECT auth.uid())::text)',
      policy_prefix || '_insert',
      rec.table_name,
      rec.owner_column
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_prefix || '_update', rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING ((SELECT auth.uid()) IS NOT NULL AND %I::text = (SELECT auth.uid())::text) WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND %I::text = (SELECT auth.uid())::text)',
      policy_prefix || '_update',
      rec.table_name,
      rec.owner_column,
      rec.owner_column
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_prefix || '_delete', rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING ((SELECT auth.uid()) IS NOT NULL AND %I::text = (SELECT auth.uid())::text)',
      policy_prefix || '_delete',
      rec.table_name,
      rec.owner_column
    );

    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated, service_role',
      rec.table_name
    );
  END LOOP;
END
$$;

COMMIT;
