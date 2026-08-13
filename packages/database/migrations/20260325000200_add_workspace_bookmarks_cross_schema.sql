-- Create workspace_bookmarks using live key types from workspaces/users.
-- This supports environments where IDs are uuid as well as text.
DO $$
DECLARE
  workspace_id_type text;
  user_id_type text;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
    INTO workspace_id_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'workspaces'
    AND a.attname = 'id'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF workspace_id_type IS NULL THEN
    RAISE EXCEPTION 'workspaces.id column not found';
  END IF;

  SELECT format_type(a.atttypid, a.atttypmod)
    INTO user_id_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'users'
    AND a.attname = 'id'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF user_id_type IS NULL THEN
    RAISE EXCEPTION 'users.id column not found';
  END IF;

  IF to_regclass('public.workspace_bookmarks') IS NULL THEN
    EXECUTE format(
      'CREATE TABLE public.workspace_bookmarks (
        id text PRIMARY KEY,
        workspace_id %s NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
        title varchar(255) NOT NULL,
        url text NOT NULL,
        tags jsonb NOT NULL DEFAULT ''[]''::jsonb,
        note text,
        created_by_user_id %s REFERENCES public.users(id) ON DELETE SET NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )',
      workspace_id_type,
      user_id_type
    );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS workspace_bookmarks_workspace_url_unique
  ON public.workspace_bookmarks (workspace_id, url);
CREATE INDEX IF NOT EXISTS idx_workspace_bookmarks_workspace_id
  ON public.workspace_bookmarks (workspace_id);
