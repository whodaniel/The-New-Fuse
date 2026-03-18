-- Access control tables for TNF membership overrides and game entitlements
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionTier') THEN
    CREATE TYPE "SubscriptionTier" AS ENUM ('STARTER', 'PRO', 'ENTERPRISE');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MembershipOverrideStatus') THEN
    CREATE TYPE "MembershipOverrideStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GameEntitlementSource') THEN
    CREATE TYPE "GameEntitlementSource" AS ENUM ('membership', 'override', 'nft', 'purchase', 'admin');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "membership_overrides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tier" "SubscriptionTier" NOT NULL DEFAULT 'PRO',
  "status" "MembershipOverrideStatus" NOT NULL DEFAULT 'ACTIVE',
  "reason" text,
  "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "revoked_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "expires_at" timestamp,
  "revoked_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_membership_overrides_user_id"
  ON "membership_overrides" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_membership_overrides_status"
  ON "membership_overrides" ("status");

CREATE TABLE IF NOT EXISTS "game_access_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "game_id" varchar(120) NOT NULL,
  "label" varchar(255),
  "description" text,
  "required_tier" "SubscriptionTier" NOT NULL DEFAULT 'STARTER',
  "requires_membership" boolean NOT NULL DEFAULT false,
  "required_nft_contract" varchar(255),
  "required_nft_chain_id" integer,
  "required_nft_token_id" varchar(128),
  "required_nft_traits" jsonb,
  "config" jsonb,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "game_access_rules_game_id_unique"
  ON "game_access_rules" ("game_id");
CREATE INDEX IF NOT EXISTS "idx_game_access_rules_active"
  ON "game_access_rules" ("is_active");

CREATE TABLE IF NOT EXISTS "game_entitlements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "game_id" varchar(120) NOT NULL,
  "source" "GameEntitlementSource" NOT NULL DEFAULT 'membership',
  "tier_granted" "SubscriptionTier" NOT NULL DEFAULT 'STARTER',
  "expires_at" timestamp,
  "metadata" jsonb,
  "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "game_entitlements_user_game_unique"
  ON "game_entitlements" ("user_id", "game_id");
CREATE INDEX IF NOT EXISTS "idx_game_entitlements_game_id"
  ON "game_entitlements" ("game_id");
