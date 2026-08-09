-- 0010_add_federated_ids.sql
-- Phase 9 (audit 2026-06-14, federated ID# encoding reconciliation):
-- Permanent home for the three federated ID namespaces (canonicalEntityId,
-- idNumber, lineage correlation) directly on the agents table. Before this
-- migration, only canonicalEntityId was carried (via info payload) and the
-- other two were either inline-duplicated or never persisted.
--
-- See docs/protocols/reports/FEDERATED_ID_ENCODING_AUDIT_2026-06-14.md
-- and .agent/ROLE_DEFINITIONS.md (Phase 9 section).

ALTER TABLE "agents"
  -- ID#: sequential Base58 identity assigned by FederatedIdentityService.
  -- Format: 'ID#:<Base58>'. Used for crypto-attribution of AI Wiki entries,
  -- compounding memory, and transcript stovepipes. Distinct from
  -- canonicalEntityId (which is hierarchical) and from tnf-mcid (UUID lineage).
  ADD COLUMN IF NOT EXISTS "id_number" varchar(64);

-- Unique partial index: when id_number is set it must be globally unique so
-- federated identity cannot collide between agents.
CREATE UNIQUE INDEX IF NOT EXISTS "agents_id_number_uq_idx"
  ON "agents" ("id_number")
  WHERE "id_number" IS NOT NULL;

-- federation jsonb: holds every federated ID namespace in one bundle so
-- downstream consumers can read them together. Matches the in-memory
-- `infoRecord` policy from Phase 2 — round-trips verbatim.
ALTER TABLE "agents"
  ADD COLUMN IF NOT EXISTS "federation" jsonb DEFAULT '{
    "canonicalEntityId": null,
    "idNumber": null,
    "mcid": null,
    "scopes": []
  }'::jsonb NOT NULL;

-- GIN index for federation queries.
CREATE INDEX IF NOT EXISTS "agents_federation_gin_idx"
  ON "agents" USING GIN ("federation");

CREATE INDEX IF NOT EXISTS "agents_federation_canonical_idx"
  ON "agents" ((federation->>'canonicalEntityId'));

CREATE INDEX IF NOT EXISTS "agents_federation_id_number_idx"
  ON "agents" ((federation->>'idNumber'));
