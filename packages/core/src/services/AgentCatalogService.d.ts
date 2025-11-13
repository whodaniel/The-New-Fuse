interface VectorDatabaseService {
    search(query: string, options?: any): Promise<any[]>;
    store(data: any): Promise<void>;
    addDocuments(collection: string, documents: any[], metadata?: any): Promise<void>;
    searchByText(collection: string, query: string, options?: any): Promise<any[]>;
}
/**
 * Agent node definition from catalog
 */
export interface AgentNode {
    id: string;
    role: string;
    domain: string;
    key_skills: string[];
    category?: string;
}
/**
 * Agent edge (relationship) definition
 */
export interface AgentEdge {
    source: string;
    target: string;
    label: string;
}
/**
 * Agent catalog category structure
 */
export interface AgentCategory {
    nodes: AgentNode[];
}
/**
 * Agent catalog structure (without edges)
 */
export interface AgentCatalog {
    [category: string]: AgentCategory;
}
/**
 * Agent catalog with edges
 * Note: edges is a special reserved property
 */
export type AgentCatalogWithEdges = AgentCatalog & {
    edges?: AgentEdge[];
};
/**
 * AgentCatalogService - Manages agent discovery and semantic search
 *
 * This service integrates the agent catalog with the vector database,
 * enabling semantic search across agents, skills, and domains.
 */
export declare class AgentCatalogService {
    private readonly logger;
    private vectorService?;
    private catalogLoaded;
    private agentIndex;
    private edgeIndex;
    constructor(vectorService?: VectorDatabaseService);
    /**
     * Initialize the catalog service with vector database
     */
    initialize(config?: {
        vectorService?: VectorDatabaseService;
    }): Promise<void>;
    /**
     * Ingest agent catalog into vector database
     */
    ingestCatalog(catalog: AgentCatalogWithEdges): Promise<void>;
    /**
     * Create rich content for agent embedding
     */
    private createAgentContent;
    /**
     * Search for agents using semantic search
     */
    searchAgents(params: {
        query: string;
        limit?: number;
        threshold?: number;
        category?: string;
        domain?: string;
    }): Promise<Array<{
        agent: AgentNode;
        similarity: number;
    }>>;
    /**
     * Find agents by category
     */
    findByCategory(category: string, limit?: number): Promise<AgentNode[]>;
    /**
     * Get agent by ID
     */
    getAgentById(agentId: string): AgentNode | undefined;
    /**
     * Get all agents in a category
     */
    getAgentsByCategory(category: string): AgentNode[];
    /**
     * Get agent relationships (edges)
     */
    getAgentRelationships(agentId: string): AgentEdge[];
    /**
     * Find collaborating agents (connected via edges)
     */
    findCollaborators(agentId: string): AgentNode[];
    /**
     * Get catalog statistics
     */
    getStats(): {
        totalAgents: number;
        totalEdges: number;
        categoryCounts: Record<string, number>;
        domainCounts: Record<string, number>;
        catalogLoaded: boolean;
    };
    /**
     * Recommend agents based on a task description
     */
    recommendAgents(params: {
        taskDescription: string;
        limit?: number;
        includeCollaborators?: boolean;
    }): Promise<Array<{
        agent: AgentNode;
        similarity: number;
        collaborators?: AgentNode[];
    }>>;
    /**
     * Build agent team for complex task
     */
    buildTeam(params: {
        taskDescription: string;
        requiredSkills?: string[];
        maxTeamSize?: number;
    }): Promise<{
        team: AgentNode[];
        skillCoverage: Record<string, boolean>;
        recommendations: string[];
    }>;
}
export {};
//# sourceMappingURL=AgentCatalogService.d.ts.map