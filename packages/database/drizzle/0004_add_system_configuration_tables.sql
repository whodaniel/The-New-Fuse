CREATE TABLE IF NOT EXISTS "system_configurations" (
  "key" varchar(255) PRIMARY KEY NOT NULL,
  "value" text NOT NULL,
  "category" varchar(100) DEFAULT 'general' NOT NULL,
  "description" text,
  "sensitive" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "updated_by" varchar(255)
);

CREATE TABLE IF NOT EXISTS "system_settings" (
  "id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
  "config" jsonb NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "updated_by" varchar(255)
);
