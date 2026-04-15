CREATE TABLE "ai_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"insight_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(2000),
	"severity" varchar(20) DEFAULT 'info' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_acknowledged" boolean DEFAULT false NOT NULL,
	"acknowledged_at" timestamp,
	"acknowledged_by_id" uuid,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"metric_type" varchar(50) NOT NULL,
	"metric_name" varchar(100) NOT NULL,
	"metric_value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dimensions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"source" varchar(50) NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"correlation_id" varchar(255),
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"processing_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sse_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"event_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "webhook_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"source" varchar(50) NOT NULL,
	"endpoint_url" varchar(500) NOT NULL,
	"secret_key" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_delivery_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_configuration_id" uuid NOT NULL,
	"event_id" uuid,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"response_status" integer,
	"response_body" varchar(2000),
	"delivery_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_acknowledged_by_id_users_id_fk" FOREIGN KEY ("acknowledged_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_events" ADD CONSTRAINT "business_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sse_subscriptions" ADD CONSTRAINT "sse_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery_logs" ADD CONSTRAINT "webhook_delivery_logs_webhook_configuration_id_webhook_configurations_id_fk" FOREIGN KEY ("webhook_configuration_id") REFERENCES "public"."webhook_configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery_logs" ADD CONSTRAINT "webhook_delivery_logs_event_id_business_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."business_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_insights_org_type" ON "ai_insights" USING btree ("organization_id","insight_type");--> statement-breakpoint
CREATE INDEX "idx_ai_insights_severity" ON "ai_insights" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_business_analytics_org_metric" ON "business_analytics" USING btree ("organization_id","metric_type");--> statement-breakpoint
CREATE INDEX "idx_business_analytics_period" ON "business_analytics" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_business_events_org_type" ON "business_events" USING btree ("organization_id","type");--> statement-breakpoint
CREATE INDEX "idx_business_events_status" ON "business_events" USING btree ("processing_status");--> statement-breakpoint
CREATE INDEX "idx_business_events_created" ON "business_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_business_events_correlation" ON "business_events" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_delivery_webhook_id" ON "webhook_delivery_logs" USING btree ("webhook_configuration_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_delivery_status" ON "webhook_delivery_logs" USING btree ("delivery_status");