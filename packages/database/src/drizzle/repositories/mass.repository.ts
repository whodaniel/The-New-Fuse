import { and, desc, eq } from 'drizzle-orm';
import { db } from '../client';
import {
  agentPromptVersions,
  optimizationJobs,
  validationDatasets,
  workflowTopologies,
} from '../schema';

export const optimizationJobRepository = {
  findById: async (id: string) => {
    return await db.query.optimizationJobs.findFirst({
      where: eq(optimizationJobs.id, id),
    });
  },

  findByUser: async (userId: string, status?: string, type?: string) => {
    const conditions = [eq(optimizationJobs.userId, userId)];
    if (status) conditions.push(eq(optimizationJobs.status, status));
    if (type) conditions.push(eq(optimizationJobs.type, type));

    return await db.query.optimizationJobs.findMany({
      where: and(...conditions),
      orderBy: desc(optimizationJobs.createdAt),
    });
  },

  findByTargetId: async (targetId: string, userId: string) => {
    return await db.query.optimizationJobs.findMany({
      where: and(eq(optimizationJobs.targetId, targetId), eq(optimizationJobs.userId, userId)),
      orderBy: desc(optimizationJobs.createdAt),
    });
  },

  create: async (data: typeof optimizationJobs.$inferInsert) => {
    const [job] = await db.insert(optimizationJobs).values(data).returning();
    return job;
  },

  update: async (id: string, data: Partial<typeof optimizationJobs.$inferInsert>) => {
    const [job] = await db
      .update(optimizationJobs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(optimizationJobs.id, id))
      .returning();
    return job;
  },
};

export const workflowTopologyRepository = {
  findById: async (id: string) => {
    return await db.query.workflowTopologies.findFirst({
      where: eq(workflowTopologies.id, id),
    });
  },

  findByIdAndUser: async (id: string, userId: string) => {
    return await db.query.workflowTopologies.findFirst({
      where: and(eq(workflowTopologies.id, id), eq(workflowTopologies.userId, userId)),
    });
  },

  create: async (data: typeof workflowTopologies.$inferInsert) => {
    const [topology] = await db.insert(workflowTopologies).values(data).returning();
    return topology;
  },

  update: async (id: string, data: Partial<typeof workflowTopologies.$inferInsert>) => {
    const [topology] = await db
      .update(workflowTopologies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(workflowTopologies.id, id))
      .returning();
    return topology;
  },
};

export const validationDatasetRepository = {
  findById: async (id: string) => {
    return await db.query.validationDatasets.findFirst({
      where: eq(validationDatasets.id, id),
    });
  },
};

export const agentPromptVersionRepository = {
  findByAgentId: async (agentId: string) => {
    return await db.query.agentPromptVersions.findMany({
      where: eq(agentPromptVersions.agentId, agentId),
      orderBy: desc(agentPromptVersions.versionNumber),
    });
  },

  findLatestByAgentId: async (agentId: string, massStage?: string) => {
    const conditions = [eq(agentPromptVersions.agentId, agentId)];
    if (massStage) conditions.push(eq(agentPromptVersions.massStage, massStage));

    return await db.query.agentPromptVersions.findFirst({
      where: and(...conditions),
      orderBy: desc(agentPromptVersions.versionNumber),
    });
  },

  create: async (data: typeof agentPromptVersions.$inferInsert) => {
    const [version] = await db.insert(agentPromptVersions).values(data).returning();
    return version;
  },
};
