import { AgentCatalogService } from '@the-new-fuse/core';
export declare class AgentCatalogController {
    private readonly catalogService;
    constructor(catalogService: AgentCatalogService);
    /**
     * Search for agents using semantic search
     * POST /api/agents/search
     */
    searchAgents(body: {
        query: string;
        category?: string;
        domain?: string;
        limit?: number;
        threshold?: number;
    }): Promise<{
        success: boolean;
        results: any;
        count: any;
        error?: never;
    } | {
        success: boolean;
        error: string;
        results: never[];
        count?: never;
    }>;
    /**
     * Get agent recommendations for a task
     * POST /api/agents/recommend
     */
    recommendAgents(body: {
        taskDescription: string;
        limit?: number;
        includeCollaborators?: boolean;
    }): Promise<{
        success: boolean;
        recommendations: any;
        count: any;
        error?: never;
    } | {
        success: boolean;
        error: string;
        recommendations: never[];
        count?: never;
    }>;
    /**
     * Build an agent team for a complex task
     * POST /api/agents/build-team
     */
    buildTeam(body: {
        taskDescription: string;
        requiredSkills?: string[];
        maxTeamSize?: number;
    }): Promise<any>;
    /**
     * Find agents by skill
     * GET /api/agents/by-skill/:skill
     */
    findBySkill(skill: string, limit?: number): Promise<{
        success: boolean;
        agents: any;
        count: any;
        error?: never;
    } | {
        success: boolean;
        error: string;
        agents: never[];
        count?: never;
    }>;
    /**
     * Find agents by domain
     * GET /api/agents/by-domain/:domain
     */
    findByDomain(domain: string, limit?: number): Promise<{
        success: boolean;
        agents: any;
        count: any;
        error?: never;
    } | {
        success: boolean;
        error: string;
        agents: never[];
        count?: never;
    }>;
    /**
     * Find agents by category
     * GET /api/agents/by-category/:category
     */
    findByCategory(category: string, limit?: number): Promise<{
        success: boolean;
        agents: any;
        count: any;
        error?: never;
    } | {
        success: boolean;
        error: string;
        agents: never[];
        count?: never;
    }>;
    /**
     * Get agent by ID
     * GET /api/agents/:id
     */
    getAgent(id: string): Promise<{
        success: boolean;
        error: string;
        agent?: never;
        relationships?: never;
        collaborators?: never;
    } | {
        success: boolean;
        agent: any;
        relationships: any;
        collaborators: any;
        error?: never;
    }>;
    /**
     * Get catalog statistics
     * GET /api/agents/stats
     */
    getStats(): Promise<any>;
    /**
     * Get all categories
     * GET /api/agents/categories
     */
    getCategories(): Promise<{
        success: boolean;
        categories: {
            name: string;
            count: unknown;
        }[];
        error?: never;
    } | {
        success: boolean;
        error: string;
        categories: never[];
    }>;
    /**
     * Ingest agent catalog (admin endpoint)
     * POST /api/agents/catalog/ingest
     */
    ingestCatalog(catalog: any): Promise<{
        success: boolean;
        message: string;
        stats: any;
        error?: never;
    } | {
        success: boolean;
        error: string;
        message?: never;
        stats?: never;
    }>;
}
//# sourceMappingURL=agent-catalog.controller.d.ts.map