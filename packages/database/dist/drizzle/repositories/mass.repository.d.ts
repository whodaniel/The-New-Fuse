import { agentPromptVersions, optimizationJobs, workflowTopologies } from '../schema.js';
export declare const optimizationJobRepository: {
    findById: (id: string) => Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        userId: string | null;
        type: string;
        config: unknown;
        error: string | null;
        targetId: string;
        results: unknown;
    } | undefined>;
    findByUser: (userId: string, status?: string, type?: string) => Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        userId: string | null;
        type: string;
        config: unknown;
        error: string | null;
        targetId: string;
        results: unknown;
    }[]>;
    findByTargetId: (targetId: string, userId: string) => Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        userId: string | null;
        type: string;
        config: unknown;
        error: string | null;
        targetId: string;
        results: unknown;
    }[]>;
    create: (data: typeof optimizationJobs.$inferInsert) => Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        userId: string | null;
        type: string;
        config: unknown;
        error: string | null;
        targetId: string;
        results: unknown;
    }>;
    update: (id: string, data: Partial<typeof optimizationJobs.$inferInsert>) => Promise<{
        id: string;
        type: string;
        targetId: string;
        status: string;
        config: unknown;
        results: unknown;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        error: string | null;
    }>;
};
export declare const workflowTopologyRepository: {
    findById: (id: string) => Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        performanceMetrics: unknown;
        nodes: unknown;
        edges: unknown;
        massOptimized: boolean;
    } | undefined>;
    findByIdAndUser: (id: string, userId: string) => Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        performanceMetrics: unknown;
        nodes: unknown;
        edges: unknown;
        massOptimized: boolean;
    } | undefined>;
    create: (data: typeof workflowTopologies.$inferInsert) => Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        performanceMetrics: unknown;
        nodes: unknown;
        edges: unknown;
        massOptimized: boolean;
    }>;
    update: (id: string, data: Partial<typeof workflowTopologies.$inferInsert>) => Promise<{
        id: string;
        name: string;
        description: string | null;
        nodes: unknown;
        edges: unknown;
        performanceMetrics: unknown;
        massOptimized: boolean;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
};
export declare const validationDatasetRepository: {
    findById: (id: string) => Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        items: unknown;
    } | undefined>;
};
export declare const agentPromptVersionRepository: {
    findByAgentId: (agentId: string) => Promise<{
        id: string;
        createdAt: Date;
        agentId: string;
        versionNumber: number;
        instruction: string;
        exemplars: unknown;
        performanceMetrics: unknown;
        massStage: string | null;
    }[]>;
    findLatestByAgentId: (agentId: string, massStage?: string) => Promise<{
        id: string;
        createdAt: Date;
        agentId: string;
        versionNumber: number;
        instruction: string;
        exemplars: unknown;
        performanceMetrics: unknown;
        massStage: string | null;
    } | undefined>;
    create: (data: typeof agentPromptVersions.$inferInsert) => Promise<{
        id: string;
        createdAt: Date;
        agentId: string;
        versionNumber: number;
        instruction: string;
        exemplars: unknown;
        performanceMetrics: unknown;
        massStage: string | null;
    }>;
};
//# sourceMappingURL=mass.repository.d.ts.map