-- Workspace-level RLS guardrails for shared library artifacts.
-- Enforces owner/member visibility and owner-controlled workspace mutation.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.workspaces') IS NOT NULL THEN
    ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS workspaces_select_guard ON public.workspaces;
    CREATE POLICY workspaces_select_guard
      ON public.workspaces
      FOR SELECT
      TO authenticated
      USING (
        (SELECT auth.uid()) IS NOT NULL
        AND private.tnf_workspace_member_or_owner(id::text)
      );

    DROP POLICY IF EXISTS workspaces_insert_guard ON public.workspaces;
    CREATE POLICY workspaces_insert_guard
      ON public.workspaces
      FOR INSERT
      TO authenticated
      WITH CHECK (
        (SELECT auth.uid()) IS NOT NULL
        AND owner_id::text = (SELECT auth.uid())::text
      );

    DROP POLICY IF EXISTS workspaces_update_guard ON public.workspaces;
    CREATE POLICY workspaces_update_guard
      ON public.workspaces
      FOR UPDATE
      TO authenticated
      USING (
        (SELECT auth.uid()) IS NOT NULL
        AND owner_id::text = (SELECT auth.uid())::text
      )
      WITH CHECK (
        (SELECT auth.uid()) IS NOT NULL
        AND owner_id::text = (SELECT auth.uid())::text
      );

    DROP POLICY IF EXISTS workspaces_delete_guard ON public.workspaces;
    CREATE POLICY workspaces_delete_guard
      ON public.workspaces
      FOR DELETE
      TO authenticated
      USING (
        (SELECT auth.uid()) IS NOT NULL
        AND owner_id::text = (SELECT auth.uid())::text
      );

    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.workspaces TO authenticated, service_role;
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.workspace_bookmarks') IS NOT NULL THEN
    ALTER TABLE public.workspace_bookmarks ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS workspace_bookmarks_select_guard ON public.workspace_bookmarks;
    CREATE POLICY workspace_bookmarks_select_guard
      ON public.workspace_bookmarks
      FOR SELECT
      TO authenticated
      USING (
        (SELECT auth.uid()) IS NOT NULL
        AND private.tnf_workspace_member_or_owner(workspace_id::text)
      );

    DROP POLICY IF EXISTS workspace_bookmarks_insert_guard ON public.workspace_bookmarks;
    CREATE POLICY workspace_bookmarks_insert_guard
      ON public.workspace_bookmarks
      FOR INSERT
      TO authenticated
      WITH CHECK (
        (SELECT auth.uid()) IS NOT NULL
        AND private.tnf_workspace_member_or_owner(workspace_id::text)
        AND (
          created_by_user_id IS NULL
          OR created_by_user_id::text = (SELECT auth.uid())::text
        )
      );

    DROP POLICY IF EXISTS workspace_bookmarks_update_guard ON public.workspace_bookmarks;
    CREATE POLICY workspace_bookmarks_update_guard
      ON public.workspace_bookmarks
      FOR UPDATE
      TO authenticated
      USING (
        (SELECT auth.uid()) IS NOT NULL
        AND private.tnf_workspace_member_or_owner(workspace_id::text)
      )
      WITH CHECK (
        (SELECT auth.uid()) IS NOT NULL
        AND private.tnf_workspace_member_or_owner(workspace_id::text)
        AND (
          created_by_user_id IS NULL
          OR created_by_user_id::text = (SELECT auth.uid())::text
        )
      );

    DROP POLICY IF EXISTS workspace_bookmarks_delete_guard ON public.workspace_bookmarks;
    CREATE POLICY workspace_bookmarks_delete_guard
      ON public.workspace_bookmarks
      FOR DELETE
      TO authenticated
      USING (
        (SELECT auth.uid()) IS NOT NULL
        AND private.tnf_workspace_member_or_owner(workspace_id::text)
      );

    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.workspace_bookmarks TO authenticated, service_role;
  END IF;
END
$$;

COMMIT;
