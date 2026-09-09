-- Cloud DurableTasks + usage metering types
-- TNF compute plane (not Trigger.dev clone)

DO $$ BEGIN
  ALTER TYPE "UsageType" ADD VALUE IF NOT EXISTS 'DURABLE_RUN_INVOCATION';
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "UsageType" ADD VALUE IF NOT EXISTS 'DURABLE_COMPUTE_UNITS';
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "durable_tasks" (
  "id" varchar(128) NOT NULL,
  "owner_user_id" varchar(128) NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "handler" varchar(128) NOT NULL DEFAULT 'echo',
  "description" text,
  "queue_name" varchar(128) NOT NULL DEFAULT 'default',
  "concurrency_limit" integer NOT NULL DEFAULT 5,
  "machine" varchar(32) NOT NULL DEFAULT 'small',
  "deployed_version" integer NOT NULL DEFAULT 1,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "durable_tasks_pk" PRIMARY KEY ("owner_user_id", "id")
);

CREATE INDEX IF NOT EXISTS "durable_tasks_owner_idx" ON "durable_tasks" ("owner_user_id");

CREATE TABLE IF NOT EXISTS "durable_runs" (
  "id" varchar(64) PRIMARY KEY,
  "owner_user_id" varchar(128) NOT NULL,
  "task_id" varchar(128) NOT NULL,
  "task_version" integer NOT NULL DEFAULT 1,
  "status" varchar(32) NOT NULL DEFAULT 'QUEUED',
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "attempt" integer NOT NULL DEFAULT 0,
  "ownership" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "result" jsonb,
  "error" text,
  "public_token_hash" varchar(128),
  "machine" varchar(32) DEFAULT 'small',
  "started_at" timestamp,
  "completed_at" timestamp,
  "duration_ms" integer,
  "estimated_cost_units" double precision,
  "authorization_id" varchar(128),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "durable_runs_owner_idx" ON "durable_runs" ("owner_user_id");
CREATE INDEX IF NOT EXISTS "durable_runs_status_idx" ON "durable_runs" ("status");
CREATE INDEX IF NOT EXISTS "durable_runs_task_idx" ON "durable_runs" ("owner_user_id", "task_id");
CREATE INDEX IF NOT EXISTS "durable_runs_created_idx" ON "durable_runs" ("created_at");

CREATE TABLE IF NOT EXISTS "durable_schedules" (
  "id" varchar(128) NOT NULL,
  "owner_user_id" varchar(128) NOT NULL,
  "task_id" varchar(128) NOT NULL,
  "every_ms" integer NOT NULL,
  "payload" jsonb,
  "enabled" boolean NOT NULL DEFAULT true,
  "last_fired_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "durable_schedules_pk" PRIMARY KEY ("owner_user_id", "id")
);

CREATE INDEX IF NOT EXISTS "durable_schedules_owner_idx" ON "durable_schedules" ("owner_user_id");

CREATE TABLE IF NOT EXISTS "durable_run_events" (
  "id" varchar(64) PRIMARY KEY,
  "owner_user_id" varchar(128) NOT NULL,
  "run_id" varchar(64) NOT NULL,
  "seq" integer NOT NULL,
  "type" varchar(128) NOT NULL,
  "data" jsonb,
  "at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "durable_run_events_run_seq_idx" ON "durable_run_events" ("run_id", "seq");
CREATE INDEX IF NOT EXISTS "durable_run_events_owner_idx" ON "durable_run_events" ("owner_user_id");
