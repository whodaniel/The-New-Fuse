/**
 * WorkflowRegistry
 * Manages the registry of n8n workflows
 */
import { N8nWorkflow, WorkflowCategory, WorkflowSearchQuery, WorkflowSearchResult, WorkflowSource, WorkflowStats } from '../types/index.js';
export interface RegistryConfig {
    storageDir?: string;
    enablePersistence?: boolean;
}
export declare class WorkflowRegistry {
    private workflows;
    private storageDir;
    private enablePersistence;
    private lastSync;
    constructor(config?: RegistryConfig);
    /**
     * Initialize registry
     */
    initialize(): Promise<void>;
    /**
     * Add workflow to registry
     */
    addWorkflow(workflow: N8nWorkflow): void;
    /**
     * Add multiple workflows
     */
    addWorkflows(workflows: N8nWorkflow[]): void;
    /**
     * Get workflow by ID
     */
    getWorkflow(id: string): N8nWorkflow | undefined;
    /**
     * Get all workflows
     */
    getAllWorkflows(): N8nWorkflow[];
    /**
     * Search workflows
     */
    search(query: WorkflowSearchQuery): WorkflowSearchResult;
    /**
     * Get workflows by category
     */
    getByCategory(category: WorkflowCategory): N8nWorkflow[];
    /**
     * Get workflows by source
     */
    getBySource(source: WorkflowSource): N8nWorkflow[];
    /**
     * Get workflows by tag
     */
    getByTag(tag: string): N8nWorkflow[];
    /**
     * Get workflow statistics
     */
    getStats(): WorkflowStats;
    /**
     * Get all categories
     */
    getCategories(): WorkflowCategory[];
    /**
     * Get all tags
     */
    getAllTags(): string[];
    /**
     * Update workflow
     */
    updateWorkflow(id: string, updates: Partial<N8nWorkflow>): boolean;
    /**
     * Delete workflow
     */
    deleteWorkflow(id: string): boolean;
    /**
     * Clear all workflows
     */
    clear(): void;
    /**
     * Get workflow count
     */
    count(): number;
    /**
     * Check if workflow exists
     */
    has(id: string): boolean;
    /**
     * Save registry to disk
     */
    saveToDisk(): Promise<void>;
    /**
     * Load registry from disk
     */
    loadFromDisk(): Promise<boolean>;
    /**
     * Export workflows to JSON
     */
    exportToJSON(): string;
    /**
     * Import workflows from JSON
     */
    importFromJSON(json: string): number;
    /**
     * Update last sync time
     */
    updateLastSync(): void;
    /**
     * Get similar workflows
     */
    getSimilarWorkflows(workflowId: string, limit?: number): N8nWorkflow[];
    /**
     * Calculate similarity between two workflows
     */
    private calculateSimilarity;
}
//# sourceMappingURL=WorkflowRegistry.d.ts.map