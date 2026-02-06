CREATE TABLE "agent_invitation_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_hash" varchar(128) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"last_used_by_agent_id" uuid,
	"last_used_by_registration_id" uuid,
	"created_by_user_id" uuid,
	"agency_id" uuid,
	"tenant_id" varchar(255),
	"organization_id" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_invitation_codes_code_hash_unique" UNIQUE("code_hash")
);

ALTER TABLE "agent_invitation_codes" ADD CONSTRAINT "agent_invitation_codes_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "agent_invitation_codes" ADD CONSTRAINT "agent_invitation_codes_agency_id_workspaces_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
