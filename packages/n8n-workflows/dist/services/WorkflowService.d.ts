/**
 * WorkflowService
 * High-level service for managing n8n workflows
 */
import { RegistryConfig } from '../registry/WorkflowRegistry.js';
import { N8nWorkflow, WorkflowCategory, WorkflowImportRequest, WorkflowImportResponse, WorkflowSearchQuery, WorkflowSearchResult, WorkflowSource, WorkflowStats } from '../types/index.js';
export declare class WorkflowService {
    private fetcher;
    private parser;
    private categorizer;
    private registry;
    private initialized;
    constructor(registryConfig?: RegistryConfig);
    /**
     * Initialize the service
     */
    initialize(): Promise<void>;
    /**
     * Sync workflows from all sources
     */
    syncWorkflows(): Promise<{
        success: boolean;
        totalWorkflows: number;
        stats: WorkflowStats;
        errors: string[];
    }>;
    /**
     * Sync workflows from a specific source
     */
    syncFromSource(source: WorkflowSource): Promise<number>;
    /**
     * Search workflows
     */
    search(query: WorkflowSearchQuery): Promise<WorkflowSearchResult>;
    /**
     * Get workflow by ID
     */
    getWorkflow(id: string): Promise<N8nWorkflow | undefined>;
    /**
     * Get all workflows
     */
    getAllWorkflows(): Promise<N8nWorkflow[]>;
    /**
     * Get workflows by category
     */
    getByCategory(category: WorkflowCategory): Promise<N8nWorkflow[]>;
    /**
     * Get workflow statistics
     */
    getStats(): Promise<WorkflowStats>;
    /**
     * Get all categories
     */
    getCategories(): Promise<{
        categories: Array<{
            name: WorkflowCategory;
            count: number;
            displayName: string;
            description: string;
        }>;
    }>;
    /**
     * Import workflow to n8n instance
     */
    importToN8n(request: WorkflowImportRequest): Promise<WorkflowImportResponse>;
    /**
     * Get similar workflows
     */
    getSimilarWorkflows(workflowId: string, limit?: number): Promise<N8nWorkflow[]>;
    /**
     * Get all tags
     */
    getAllTags(): Promise<string[]>;
    /**
     * Get workflows by tag
     */
    getByTag(tag: string): Promise<N8nWorkflow[]>;
    /**
     * Export workflows to JSON
     */
    exportToJSON(): Promise<string>;
    /**
     * Import workflows from JSON
     */
    importFromJSON(json: string): Promise<number>;
    /**
     * Get workflow count
     */
    getCount(): Promise<number>;
    /**
     * Clear all workflows
     */
    clear(): Promise<void>;
    private validateN8nInstanceUrl;
    private isDockerComposeHostname;
}
//# sourceMappingURL=WorkflowService.d.ts.map