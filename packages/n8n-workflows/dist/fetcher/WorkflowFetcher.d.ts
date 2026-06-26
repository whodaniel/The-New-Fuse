/**
 * WorkflowFetcher
 * Fetches n8n workflows from GitHub repositories
 */
import type { N8nWorkflow, WorkflowFetchResult, WorkflowSource } from '../types/index.js';
export interface RepositoryConfig {
    source: WorkflowSource;
    url: string;
    branch?: string;
    workflowPaths?: string[];
}
export declare class WorkflowFetcher {
    private git;
    private parser;
    private categorizer;
    private cacheDir;
    private repositories;
    constructor(cacheDir?: string);
    /**
     * Fetch workflows from all repositories
     */
    fetchAll(): Promise<{
        workflows: N8nWorkflow[];
        results: WorkflowFetchResult[];
    }>;
    /**
     * Fetch workflows from a specific repository
     */
    fetchFromRepository(repo: RepositoryConfig): Promise<WorkflowFetchResult>;
    /**
     * Load workflows from a repository
     */
    private loadWorkflowsFromRepo;
    /**
     * Check if a JSON file is a workflow
     */
    private isWorkflowFile;
    /**
     * Get repository path
     */
    private getRepoPath;
    /**
     * Ensure cache directory exists
     */
    private ensureCacheDir;
    /**
     * Clear cache
     */
    clearCache(): Promise<void>;
    /**
     * Get cache info
     */
    getCacheInfo(): Promise<{
        exists: boolean;
        size?: number;
        repositories: string[];
    }>;
    /**
     * Fetch workflows from a specific source
     */
    fetchFromSource(source: WorkflowSource): Promise<N8nWorkflow[]>;
    /**
     * Get all configured sources
     */
    getSources(): WorkflowSource[];
    /**
     * Add custom repository
     */
    addRepository(config: RepositoryConfig): void;
}
//# sourceMappingURL=WorkflowFetcher.d.ts.map