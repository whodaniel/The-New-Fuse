-- Librarian RLS blueprint (DRAFT ONLY - DO NOT AUTO-APPLY)
-- Date: 2026-05-05
-- Validated and revised: 2026-05-06
-- Scope: librarian, librarian_ingest

BEGIN;

-- Safety preflight: ensure ownership function exists.
DO $$
BEGIN
  IF to_regprocedure('public.current_owner_principal_id()') IS NULL THEN
    RAISE EXCEPTION 'Missing required function public.current_owner_principal_id()';
  END IF;
END $$;

-- Stage 1: ownership normalization
ALTER TABLE librarian.timeline_event
  ADD COLUMN IF NOT EXISTS owner_principal_id TEXT;

ALTER TABLE librarian_ingest.ingestion_run
  ADD COLUMN IF NOT EXISTS owner_principal_id TEXT;

-- Backfill timeline_event owner from evidence-linked artifact/source owner.
UPDATE librarian.timeline_event te
SET owner_principal_id = (
  SELECT s.owner_principal_id
  FROM librarian.timeline_event_artifact tea
  JOIN librarian.artifact a
    ON a.artifact_id = tea.artifact_id
  JOIN librarian.source s
    ON s.source_id = a.source_id
  WHERE tea.timeline_event_id = te.timeline_event_id
  ORDER BY s.owner_principal_id
  LIMIT 1
)
WHERE te.owner_principal_id IS NULL
   OR te.owner_principal_id = ''::text;

-- Backfill ingestion_run owner from source where present.
UPDATE librarian_ingest.ingestion_run ir
SET owner_principal_id = s.owner_principal_id
FROM librarian.source s
WHERE (ir.owner_principal_id IS NULL OR ir.owner_principal_id = ''::text)
  AND ir.source_id = s.source_id;

UPDATE librarian.timeline_event
SET owner_principal_id = 'daniel'::text
WHERE owner_principal_id IS NULL
   OR owner_principal_id = ''::text;

UPDATE librarian_ingest.ingestion_run
SET owner_principal_id = 'daniel'::text
WHERE owner_principal_id IS NULL
   OR owner_principal_id = ''::text;

ALTER TABLE librarian.timeline_event
  ALTER COLUMN owner_principal_id SET DEFAULT 'daniel'::text;

ALTER TABLE librarian_ingest.ingestion_run
  ALTER COLUMN owner_principal_id SET DEFAULT 'daniel'::text;

ALTER TABLE librarian.timeline_event
  ALTER COLUMN owner_principal_id SET NOT NULL;

ALTER TABLE librarian_ingest.ingestion_run
  ALTER COLUMN owner_principal_id SET NOT NULL;

-- Stage 2: enable RLS
ALTER TABLE librarian.source ENABLE ROW LEVEL SECURITY;
ALTER TABLE librarian.artifact ENABLE ROW LEVEL SECURITY;
ALTER TABLE librarian.artifact_blob ENABLE ROW LEVEL SECURITY;
ALTER TABLE librarian.artifact_text ENABLE ROW LEVEL SECURITY;
ALTER TABLE librarian.text_chunk ENABLE ROW LEVEL SECURITY;
ALTER TABLE librarian.timeline_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE librarian.timeline_event_artifact ENABLE ROW LEVEL SECURITY;
ALTER TABLE librarian_ingest.ingestion_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE librarian_ingest.ingestion_artifact_result ENABLE ROW LEVEL SECURITY;

-- Stage 2: owner policies (DROP + CREATE because CREATE POLICY IF NOT EXISTS
-- is not portable across deployed Postgres versions)
DROP POLICY IF EXISTS owner_manage_source ON librarian.source;
CREATE POLICY owner_manage_source
  ON librarian.source
  FOR ALL
  TO authenticated
  USING (owner_principal_id = public.current_owner_principal_id())
  WITH CHECK (owner_principal_id = public.current_owner_principal_id());

DROP POLICY IF EXISTS owner_manage_artifact ON librarian.artifact;
CREATE POLICY owner_manage_artifact
  ON librarian.artifact
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM librarian.source s
      WHERE s.source_id = artifact.source_id
        AND s.owner_principal_id = public.current_owner_principal_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM librarian.source s
      WHERE s.source_id = artifact.source_id
        AND s.owner_principal_id = public.current_owner_principal_id()
    )
  );

DROP POLICY IF EXISTS owner_manage_artifact_blob ON librarian.artifact_blob;
CREATE POLICY owner_manage_artifact_blob
  ON librarian.artifact_blob
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM librarian.artifact a
      JOIN librarian.source s
        ON s.source_id = a.source_id
      WHERE a.artifact_id = artifact_blob.artifact_id
        AND s.owner_principal_id = public.current_owner_principal_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM librarian.artifact a
      JOIN librarian.source s
        ON s.source_id = a.source_id
      WHERE a.artifact_id = artifact_blob.artifact_id
        AND s.owner_principal_id = public.current_owner_principal_id()
    )
  );

DROP POLICY IF EXISTS owner_manage_artifact_text ON librarian.artifact_text;
CREATE POLICY owner_manage_artifact_text
  ON librarian.artifact_text
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM librarian.artifact a
      JOIN librarian.source s
        ON s.source_id = a.source_id
      WHERE a.artifact_id = artifact_text.artifact_id
        AND s.owner_principal_id = public.current_owner_principal_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM librarian.artifact a
      JOIN librarian.source s
        ON s.source_id = a.source_id
      WHERE a.artifact_id = artifact_text.artifact_id
        AND s.owner_principal_id = public.current_owner_principal_id()
    )
  );

DROP POLICY IF EXISTS owner_manage_text_chunk ON librarian.text_chunk;
CREATE POLICY owner_manage_text_chunk
  ON librarian.text_chunk
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM librarian.artifact_text atx
      JOIN librarian.artifact a
        ON a.artifact_id = atx.artifact_id
      JOIN librarian.source s
        ON s.source_id = a.source_id
      WHERE atx.text_id = text_chunk.text_id
        AND s.owner_principal_id = public.current_owner_principal_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM librarian.artifact_text atx
      JOIN librarian.artifact a
        ON a.artifact_id = atx.artifact_id
      JOIN librarian.source s
        ON s.source_id = a.source_id
      WHERE atx.text_id = text_chunk.text_id
        AND s.owner_principal_id = public.current_owner_principal_id()
    )
  );

DROP POLICY IF EXISTS owner_manage_timeline_event ON librarian.timeline_event;
CREATE POLICY owner_manage_timeline_event
  ON librarian.timeline_event
  FOR ALL
  TO authenticated
  USING (owner_principal_id = public.current_owner_principal_id())
  WITH CHECK (owner_principal_id = public.current_owner_principal_id());

DROP POLICY IF EXISTS owner_manage_timeline_event_artifact ON librarian.timeline_event_artifact;
CREATE POLICY owner_manage_timeline_event_artifact
  ON librarian.timeline_event_artifact
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM librarian.timeline_event te
      WHERE te.timeline_event_id = timeline_event_artifact.timeline_event_id
        AND te.owner_principal_id = public.current_owner_principal_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM librarian.timeline_event te
      WHERE te.timeline_event_id = timeline_event_artifact.timeline_event_id
        AND te.owner_principal_id = public.current_owner_principal_id()
    )
  );

DROP POLICY IF EXISTS owner_manage_ingestion_run ON librarian_ingest.ingestion_run;
CREATE POLICY owner_manage_ingestion_run
  ON librarian_ingest.ingestion_run
  FOR ALL
  TO authenticated
  USING (owner_principal_id = public.current_owner_principal_id())
  WITH CHECK (owner_principal_id = public.current_owner_principal_id());

DROP POLICY IF EXISTS owner_manage_ingestion_artifact_result ON librarian_ingest.ingestion_artifact_result;
CREATE POLICY owner_manage_ingestion_artifact_result
  ON librarian_ingest.ingestion_artifact_result
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM librarian_ingest.ingestion_run ir
      WHERE ir.ingestion_run_id = ingestion_artifact_result.ingestion_run_id
        AND ir.owner_principal_id = public.current_owner_principal_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM librarian_ingest.ingestion_run ir
      WHERE ir.ingestion_run_id = ingestion_artifact_result.ingestion_run_id
        AND ir.owner_principal_id = public.current_owner_principal_id()
    )
  );

-- Stage 3: grant hardening for private archive surfaces.
-- Keep anon blocked. Explicitly grant authenticated/service_role for owner
-- workflows after revocation reset.
REVOKE USAGE ON SCHEMA librarian FROM anon, authenticated, service_role;
REVOKE USAGE ON SCHEMA librarian_ingest FROM anon, authenticated, service_role;

REVOKE ALL ON ALL TABLES IN SCHEMA librarian FROM anon, authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA librarian_ingest FROM anon, authenticated, service_role;

GRANT USAGE ON SCHEMA librarian TO authenticated, service_role;
GRANT USAGE ON SCHEMA librarian_ingest TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA librarian TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA librarian_ingest TO authenticated, service_role;

COMMIT;
