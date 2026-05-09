-- Phase 6 RLS rollout for remaining public tables with RLS enabled and no policy.
-- Applies deterministic owner/tenant policies where available and explicit deny
-- policies for system-only tables to remove implicit-policy gaps.

BEGIN;

CREATE OR REPLACE FUNCTION private.tnf_feedback_owned(target_feedback_id uuid)
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
      FROM public.feedback f
      WHERE f.id = target_feedback_id
        AND f.reporter_id::text = (SELECT auth.uid())::text
    );
$$;

CREATE OR REPLACE FUNCTION private.tnf_message_visible(
  target_sender_id uuid,
  target_agent_id uuid,
  target_chat_id uuid,
  target_room_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND (
      (target_sender_id IS NOT NULL AND target_sender_id::text = (SELECT auth.uid())::text)
      OR (target_agent_id IS NOT NULL AND private.tnf_agent_owned(target_agent_id))
      OR (
        target_chat_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.chats c
          WHERE c.id = target_chat_id
            AND private.tnf_agent_owned(c.agent_id)
        )
      )
      OR (
        target_room_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.chat_room_participants crp
          WHERE crp.room_id = target_room_id
            AND crp.user_id::text = (SELECT auth.uid())::text
        )
      )
    );
$$;

CREATE OR REPLACE FUNCTION private.tnf_text_actor_matches(row_actor text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth, pg_catalog
AS $$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND row_actor IS NOT NULL
    AND (
      row_actor = (SELECT auth.uid())::text
      OR lower(row_actor) = lower(coalesce((SELECT auth.jwt() ->> 'email'), ''))
    );
$$;

REVOKE ALL ON FUNCTION private.tnf_feedback_owned(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.tnf_message_visible(uuid, uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.tnf_text_actor_matches(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.tnf_feedback_owned(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.tnf_message_visible(uuid, uuid, uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.tnf_text_actor_matches(text) TO authenticated, service_role;

DO $$
DECLARE
  rec RECORD;
  policy_base text;
BEGIN
  FOR rec IN
    SELECT *
    FROM (
      VALUES
        (
          'agent_memories'::text,
          '((agent_id IS NOT NULL AND private.tnf_agent_owned(agent_id)) OR private.tnf_project_visible(project_id))'::text,
          '((agent_id IS NOT NULL AND private.tnf_agent_owned(agent_id)) OR private.tnf_project_visible(project_id))'::text
        ),
        (
          'ai_insights'::text,
          '(acknowledged_by_id IS NOT NULL AND acknowledged_by_id::text = (SELECT auth.uid())::text)'::text,
          '(acknowledged_by_id IS NOT NULL AND acknowledged_by_id::text = (SELECT auth.uid())::text)'::text
        ),
        ('business_analytics'::text, 'false'::text, 'false'::text),
        (
          'business_events'::text,
          '(user_id IS NOT NULL AND user_id::text = (SELECT auth.uid())::text)'::text,
          '(user_id IS NOT NULL AND user_id::text = (SELECT auth.uid())::text)'::text
        ),
        ('business_metrics'::text, 'false'::text, 'false'::text),
        (
          'code_execution_usage'::text,
          'private.tnf_agent_owned(agent_id)'::text,
          'private.tnf_agent_owned(agent_id)'::text
        ),
        ('error_logs'::text, 'false'::text, 'false'::text),
        (
          'feedback_to_tasks'::text,
          'private.tnf_feedback_owned(feedback_id)'::text,
          'private.tnf_feedback_owned(feedback_id)'::text
        ),
        ('llm_configs'::text, 'false'::text, 'false'::text),
        (
          'messages'::text,
          'private.tnf_message_visible(sender_id, agent_id, chat_id, room_id)'::text,
          'private.tnf_message_visible(sender_id, agent_id, chat_id, room_id)'::text
        ),
        ('prompt_snippets'::text, 'false'::text, 'false'::text),
        ('prompt_templates'::text, '(is_public = true)'::text, 'false'::text),
        (
          'prompt_versions'::text,
          '(private.tnf_text_actor_matches(created_by) OR EXISTS (SELECT 1 FROM public.prompt_templates pt WHERE pt.id = template_id AND pt.is_public = true))'::text,
          'private.tnf_text_actor_matches(created_by)'::text
        ),
        (
          'sse_subscriptions'::text,
          '(user_id IS NOT NULL AND user_id::text = (SELECT auth.uid())::text)'::text,
          '(user_id IS NOT NULL AND user_id::text = (SELECT auth.uid())::text)'::text
        ),
        (
          'sync_conflicts'::text,
          '(tenant_id IS NOT NULL AND private.tnf_tenant_visible(tenant_id))'::text,
          '(tenant_id IS NOT NULL AND private.tnf_tenant_visible(tenant_id))'::text
        ),
        (
          'sync_states'::text,
          '(tenant_id IS NOT NULL AND private.tnf_tenant_visible(tenant_id))'::text,
          '(tenant_id IS NOT NULL AND private.tnf_tenant_visible(tenant_id))'::text
        ),
        ('system_configurations'::text, 'false'::text, 'false'::text),
        ('system_settings'::text, 'false'::text, 'false'::text),
        ('validation_datasets'::text, 'false'::text, 'false'::text),
        ('vector_embeddings'::text, 'false'::text, 'false'::text),
        ('webhook_configurations'::text, 'false'::text, 'false'::text),
        ('webhook_delivery_logs'::text, 'false'::text, 'false'::text)
    ) AS t(table_name, select_expr, write_expr)
  LOOP
    IF to_regclass(format('public.%I', rec.table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    policy_base := format('tnf_%s', rec.table_name);

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', rec.table_name);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_base || '_select', rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (%s)',
      policy_base || '_select',
      rec.table_name,
      rec.select_expr
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_base || '_insert', rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)',
      policy_base || '_insert',
      rec.table_name,
      rec.write_expr
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_base || '_update', rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)',
      policy_base || '_update',
      rec.table_name,
      rec.write_expr,
      rec.write_expr
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_base || '_delete', rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%s)',
      policy_base || '_delete',
      rec.table_name,
      rec.write_expr
    );

    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated, service_role',
      rec.table_name
    );
  END LOOP;
END
$$;

COMMIT;
