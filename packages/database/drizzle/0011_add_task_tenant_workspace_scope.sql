ALTER TABLE "pipelines" ADD COLUMN IF NOT EXISTS "tenant_id" varchar(255);
ALTER TABLE "pipelines" ADD COLUMN IF NOT EXISTS "workspace_id" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pipelines_workspace_id_workspaces_id_fk'
  ) THEN
    ALTER TABLE "pipelines"
      ADD CONSTRAINT "pipelines_workspace_id_workspaces_id_fk"
      FOREIGN KEY ("workspace_id")
      REFERENCES "public"."workspaces"("id")
      ON DELETE set null
      ON UPDATE no action;
  END IF;
END
$$;

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "tenant_id" varchar(255);
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "workspace_id" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tasks_workspace_id_workspaces_id_fk'
  ) THEN
    ALTER TABLE "tasks"
      ADD CONSTRAINT "tasks_workspace_id_workspaces_id_fk"
      FOREIGN KEY ("workspace_id")
      REFERENCES "public"."workspaces"("id")
      ON DELETE set null
      ON UPDATE no action;
  END IF;
END
$$;

ALTER TABLE "task_executions" ADD COLUMN IF NOT EXISTS "user_id" uuid;
ALTER TABLE "task_executions" ADD COLUMN IF NOT EXISTS "tenant_id" varchar(255);
ALTER TABLE "task_executions" ADD COLUMN IF NOT EXISTS "workspace_id" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'task_executions_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "task_executions"
      ADD CONSTRAINT "task_executions_user_id_users_id_fk"
      FOREIGN KEY ("user_id")
      REFERENCES "public"."users"("id")
      ON DELETE set null
      ON UPDATE no action;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'task_executions_workspace_id_workspaces_id_fk'
  ) THEN
    ALTER TABLE "task_executions"
      ADD CONSTRAINT "task_executions_workspace_id_workspaces_id_fk"
      FOREIGN KEY ("workspace_id")
      REFERENCES "public"."workspaces"("id")
      ON DELETE set null
      ON UPDATE no action;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_pipelines_tenant_id" ON "pipelines" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_pipelines_workspace_id" ON "pipelines" ("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_tasks_tenant_id" ON "tasks" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_tasks_workspace_id" ON "tasks" ("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_tasks_user_tenant_workspace" ON "tasks" ("user_id", "tenant_id", "workspace_id");
CREATE INDEX IF NOT EXISTS "idx_task_executions_user_id" ON "task_executions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_task_executions_tenant_id" ON "task_executions" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_task_executions_workspace_id" ON "task_executions" ("workspace_id");
