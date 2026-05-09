-- Phase 5 RLS rollout for marketplace, revenue, wallet, and transaction tables.
-- Ownership is resolved through agent/agent_nft/listing/wallet relationship chains.

BEGIN;

CREATE OR REPLACE FUNCTION private.tnf_agent_nft_owned(target_agent_nft_id uuid)
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
      FROM public.agent_nfts nft
      JOIN public.agents a
        ON a.id = nft.agent_id
      WHERE nft.id = target_agent_nft_id
        AND a.user_id::text = (SELECT auth.uid())::text
    );
$$;

CREATE OR REPLACE FUNCTION private.tnf_marketplace_listing_owned(target_listing_id uuid)
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
      FROM public.marketplace_listings ml
      WHERE ml.id = target_listing_id
        AND private.tnf_agent_nft_owned(ml.agent_nft_id)
    );
$$;

CREATE OR REPLACE FUNCTION private.tnf_revenue_stream_owned(target_revenue_stream_id uuid)
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
      FROM public.revenue_streams rs
      WHERE rs.id = target_revenue_stream_id
        AND private.tnf_agent_nft_owned(rs.agent_nft_id)
    );
$$;

CREATE OR REPLACE FUNCTION private.tnf_wallet_owned(target_wallet_id uuid)
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
      FROM public.wallets w
      WHERE w.id = target_wallet_id
        AND w.agent_id IS NOT NULL
        AND private.tnf_agent_owned(w.agent_id)
    );
$$;

CREATE OR REPLACE FUNCTION private.tnf_catalog_created_by_match(row_created_by text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth, pg_catalog
AS $$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND row_created_by IS NOT NULL
    AND (
      row_created_by = (SELECT auth.uid())::text
      OR lower(row_created_by) = lower(coalesce((SELECT auth.jwt() ->> 'email'), ''))
    );
$$;

REVOKE ALL ON FUNCTION private.tnf_agent_nft_owned(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.tnf_marketplace_listing_owned(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.tnf_revenue_stream_owned(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.tnf_wallet_owned(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.tnf_catalog_created_by_match(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.tnf_agent_nft_owned(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.tnf_marketplace_listing_owned(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.tnf_revenue_stream_owned(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.tnf_wallet_owned(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.tnf_catalog_created_by_match(text) TO authenticated, service_role;

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
          'fractional_shares'::text,
          'private.tnf_agent_nft_owned(agent_nft_id)'::text,
          'private.tnf_agent_nft_owned(agent_nft_id)'::text
        ),
        (
          'marketplace_listings'::text,
          'private.tnf_agent_nft_owned(agent_nft_id)'::text,
          'private.tnf_agent_nft_owned(agent_nft_id)'::text
        ),
        (
          'marketplace_offers'::text,
          'private.tnf_marketplace_listing_owned(listing_id)'::text,
          'private.tnf_marketplace_listing_owned(listing_id)'::text
        ),
        (
          'revenue_streams'::text,
          'private.tnf_agent_nft_owned(agent_nft_id)'::text,
          'private.tnf_agent_nft_owned(agent_nft_id)'::text
        ),
        (
          'revenue_distributions'::text,
          'private.tnf_revenue_stream_owned(revenue_stream_id)'::text,
          'private.tnf_revenue_stream_owned(revenue_stream_id)'::text
        ),
        (
          'wallets'::text,
          '(agent_id IS NOT NULL AND private.tnf_agent_owned(agent_id))'::text,
          '(agent_id IS NOT NULL AND private.tnf_agent_owned(agent_id))'::text
        ),
        (
          'transactions'::text,
          'private.tnf_wallet_owned(wallet_id)'::text,
          'private.tnf_wallet_owned(wallet_id)'::text
        ),
        (
          'marketplace_catalog_items'::text,
          '(publication_status = ''published''::text OR private.tnf_catalog_created_by_match(created_by))'::text,
          'private.tnf_catalog_created_by_match(created_by)'::text
        )
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
