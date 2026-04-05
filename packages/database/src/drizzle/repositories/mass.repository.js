"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentPromptVersionRepository = exports.validationDatasetRepository = exports.workflowTopologyRepository = exports.optimizationJobRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
exports.optimizationJobRepository = {
    findById: async (id) => {
        return await client_1.db.query.optimizationJobs.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.optimizationJobs.id, id),
        });
    },
    findByUser: async (userId, status, type) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.optimizationJobs.userId, userId)];
        if (status)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.optimizationJobs.status, status));
        if (type)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.optimizationJobs.type, type));
        return await client_1.db.query.optimizationJobs.findMany({
            where: (0, drizzle_orm_1.and)(...conditions),
            orderBy: (0, drizzle_orm_1.desc)(schema_1.optimizationJobs.createdAt),
        });
    },
    findByTargetId: async (targetId, userId) => {
        return await client_1.db.query.optimizationJobs.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.optimizationJobs.targetId, targetId), (0, drizzle_orm_1.eq)(schema_1.optimizationJobs.userId, userId)),
            orderBy: (0, drizzle_orm_1.desc)(schema_1.optimizationJobs.createdAt),
        });
    },
    create: async (data) => {
        const [job] = await client_1.db.insert(schema_1.optimizationJobs).values(data).returning();
        return job;
    },
    update: async (id, data) => {
        const [job] = await client_1.db
            .update(schema_1.optimizationJobs)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.optimizationJobs.id, id))
            .returning();
        return job;
    },
};
exports.workflowTopologyRepository = {
    findById: async (id) => {
        return await client_1.db.query.workflowTopologies.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.workflowTopologies.id, id),
        });
    },
    findByIdAndUser: async (id, userId) => {
        return await client_1.db.query.workflowTopologies.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workflowTopologies.id, id), (0, drizzle_orm_1.eq)(schema_1.workflowTopologies.userId, userId)),
        });
    },
    create: async (data) => {
        const [topology] = await client_1.db.insert(schema_1.workflowTopologies).values(data).returning();
        return topology;
    },
    update: async (id, data) => {
        const [topology] = await client_1.db
            .update(schema_1.workflowTopologies)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.workflowTopologies.id, id))
            .returning();
        return topology;
    },
};
exports.validationDatasetRepository = {
    findById: async (id) => {
        return await client_1.db.query.validationDatasets.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.validationDatasets.id, id),
        });
    },
};
exports.agentPromptVersionRepository = {
    findByAgentId: async (agentId) => {
        return await client_1.db.query.agentPromptVersions.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.agentPromptVersions.agentId, agentId),
            orderBy: (0, drizzle_orm_1.desc)(schema_1.agentPromptVersions.versionNumber),
        });
    },
    findLatestByAgentId: async (agentId, massStage) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.agentPromptVersions.agentId, agentId)];
        if (massStage)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.agentPromptVersions.massStage, massStage));
        return await client_1.db.query.agentPromptVersions.findFirst({
            where: (0, drizzle_orm_1.and)(...conditions),
            orderBy: (0, drizzle_orm_1.desc)(schema_1.agentPromptVersions.versionNumber),
        });
    },
    create: async (data) => {
        const [version] = await client_1.db.insert(schema_1.agentPromptVersions).values(data).returning();
        return version;
    },
};
//# sourceMappingURL=mass.repository.js.map