import { Prisma } from '@prisma/client';

export const up = async (prisma: Prisma.TransactionClient) => {
  await prisma.$executeRaw`
    CREATE TABLE "agent_metrics" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "agent_id" VARCHAR NOT NULL,
      "type" VARCHAR NOT NULL,
      "value" FLOAT NOT NULL,
      "metadata" JSONB,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE "agent_states" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "agent_id" VARCHAR NOT NULL,
      "state" JSONB NOT NULL,
      "version" INTEGER NOT NULL DEFAULT 1,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX "idx_agent_metrics_agent_id" ON "agent_metrics"("agent_id");
    CREATE INDEX "idx_agent_metrics_type" ON "agent_metrics"("type");
    CREATE INDEX "idx_agent_states_agent_id" ON "agent_states"("agent_id");
  `;
};

export const down = async (prisma: Prisma.TransactionClient) => {
  await prisma.$executeRaw`
    DROP TABLE IF EXISTS "agent_metrics";
    DROP TABLE IF EXISTS "agent_states";
  `;
};