-- Authority Grants — the server-side role registry.
--
-- The cloud counterpart to ~/.tnf/authority/roles.json. Locally, authority is a
-- 0600 file in operator custody that agent processes are refused write access
-- to. That does not translate to a multi-tenant control plane: grants must be
-- issued at runtime when a user creates a server-side agent.
--
-- So the row is durable AND self-authenticating. Every grant carries an Ed25519
-- signature over its own material, verified on read, which is why write access
-- to this table does not confer authority: a row whose signature does not verify
-- resolves to 'worker' exactly as an unknown subject does.
--
-- Signed material covers subject, role, issuer, tenant, residency, validity
-- window, nonce, proof chain and cross_residency. Signing only (did, role,
-- expiry) would let a valid signature be lifted into another tenant's row.
--
-- See docs/protocols/TNF_AUTHORITY_IDENTIFIER_STANDARD.md

DO $$ BEGIN
  CREATE TYPE "authority_role" AS ENUM ('worker', 'sub-director', 'super-director', 'super-admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "authority_residency" AS ENUM ('local', 'cloud');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "authority_grants" (
  "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- did:tnf:<scope>:<category>:<provider>:<name>:<instance>
  "subject_did"         varchar(512) NOT NULL,
  "residency"           "authority_residency" NOT NULL,
  "tenant_id"           varchar(128),
  "role"                "authority_role" NOT NULL,
  "issuer_did"          varchar(512) NOT NULL,

  "signature"           text NOT NULL,
  "signature_algorithm" varchar(32) NOT NULL DEFAULT 'Ed25519',
  "signing_key_did"     varchar(512) NOT NULL,
  "nonce"               varchar(128) NOT NULL,

  -- Expiry is the revocation mechanism: a signature cannot be un-signed, so
  -- authority is withdrawn by letting it lapse. revoked_at covers the immediate
  -- case and is deliberately OUTSIDE the signed material, so revoking does not
  -- require re-signing.
  "not_before"          timestamp NOT NULL DEFAULT now(),
  "expires_at"          timestamp NOT NULL,
  "revoked_at"          timestamp,
  "revocation_reason"   text,

  -- The operator exception: this holder may ISSUE across the local/cloud
  -- boundary. Part of the signed material, so it cannot be switched on by a row
  -- write. A grant that crosses the boundary must not itself carry it.
  "cross_residency"     boolean NOT NULL DEFAULT false,

  "parent_grant_id"     uuid REFERENCES "authority_grants"("id") ON DELETE RESTRICT,
  "proof_chain"         jsonb NOT NULL DEFAULT '[]'::jsonb,
  "purpose"             text,

  "created_at"          timestamp NOT NULL DEFAULT now(),
  "updated_at"          timestamp NOT NULL DEFAULT now()
);

-- The read path resolves by subject, so this index is on the hot path.
CREATE INDEX IF NOT EXISTS "authority_grants_subject_idx"  ON "authority_grants" ("subject_did");
CREATE INDEX IF NOT EXISTS "authority_grants_tenant_idx"   ON "authority_grants" ("tenant_id");
CREATE INDEX IF NOT EXISTS "authority_grants_expiry_idx"   ON "authority_grants" ("expires_at");

-- "Which machines currently hold authority in the cloud plane, and until when"
-- must be answerable in one query — that visibility is the justification for
-- permitting the crossing at all. Partial, since bridges are rare by design.
CREATE INDEX IF NOT EXISTS "authority_grants_cross_residency_idx"
  ON "authority_grants" ("cross_residency") WHERE "cross_residency" = true;

-- The nonce is single-use and inside the signed material, so a unique index here
-- stops a valid row from being duplicated into a second grant.
CREATE UNIQUE INDEX IF NOT EXISTS "authority_grants_nonce_idx" ON "authority_grants" ("nonce");

-- A grant is meaningless if it expires before it begins.
ALTER TABLE "authority_grants" DROP CONSTRAINT IF EXISTS "authority_grants_window_check";
ALTER TABLE "authority_grants"
  ADD CONSTRAINT "authority_grants_window_check" CHECK ("expires_at" > "not_before");

-- Every subject must be a did:tnf. A bare agent id here would reintroduce the
-- untraceable grant this table exists to replace.
ALTER TABLE "authority_grants" DROP CONSTRAINT IF EXISTS "authority_grants_subject_did_check";
ALTER TABLE "authority_grants"
  ADD CONSTRAINT "authority_grants_subject_did_check" CHECK ("subject_did" LIKE 'did:tnf:%');
