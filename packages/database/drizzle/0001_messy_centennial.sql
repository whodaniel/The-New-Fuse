CREATE TABLE "jules_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"config_type" varchar DEFAULT 'disabled' NOT NULL,
	"api_key_encrypted" text,
	"webhook_secret" varchar(255),
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jules_configs_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "jules_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"jules_session_id" varchar(255) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"delegated_by_agent_id" uuid,
	"conversation_id" varchar(255),
	"status" varchar DEFAULT 'pending' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jules_sessions_jules_session_id_unique" UNIQUE("jules_session_id")
);
--> statement-breakpoint
CREATE TABLE "jules_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"session_id" uuid,
	"jules_session_id" varchar(255) NOT NULL,
	"used_customer_key" boolean DEFAULT false NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"duration_minutes" integer,
	"billable_amount" numeric(10, 2),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jules_configs" ADD CONSTRAINT "jules_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jules_sessions" ADD CONSTRAINT "jules_sessions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jules_sessions" ADD CONSTRAINT "jules_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jules_sessions" ADD CONSTRAINT "jules_sessions_delegated_by_agent_id_agents_id_fk" FOREIGN KEY ("delegated_by_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jules_usage_logs" ADD CONSTRAINT "jules_usage_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jules_usage_logs" ADD CONSTRAINT "jules_usage_logs_session_id_jules_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."jules_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_jules_sessions_task_id" ON "jules_sessions" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_jules_sessions_jules_session_id" ON "jules_sessions" USING btree ("jules_session_id");--> statement-breakpoint
CREATE INDEX "idx_jules_sessions_tenant_id" ON "jules_sessions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_jules_usage_logs_tenant_id_created_at" ON "jules_usage_logs" USING btree ("tenant_id","created_at" desc);