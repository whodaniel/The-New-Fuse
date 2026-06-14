/**
 * N8N Workflows Controller
 * REST API endpoints for n8n workflow management
 */
import type { WorkflowCategory, WorkflowImportRequest, WorkflowSource } from '@the-new-fuse/n8n-workflows';
export declare class N8nWorkflowsController {
    private workflowService;
    constructor();
    /**
     * GET /api/workflows/n8n - List all workflows
     */
    listWorkflows(query?: string, category?: WorkflowCategory, source?: WorkflowSource, tags?: string, complexity?: 'simple' | 'medium' | 'complex', limit?: string, offset?: string): Promise<{
        success: boolean;
        data: import("@the-new-fuse/n8n-workflows").WorkflowSearchResult;
    }>;
    /**
     * GET /api/workflows/n8n/categories - List categories
     */
    listCategories(): Promise<{
        success: boolean;
        data: {
            categories: Array<{
                name: WorkflowCategory;
                count: number;
                displayName: string;
                description: string;
            }>;
        };
    }>;
    /**
     * GET /api/workflows/n8n/stats - Get workflow statistics
     */
    getStats(): Promise<{
        success: boolean;
        data: import("@the-new-fuse/n8n-workflows").WorkflowStats;
    }>;
    /**
     * GET /api/workflows/n8n/tags - Get all tags
     */
    getTags(): Promise<{
        success: boolean;
        data: {
            tags: string[];
        };
    }>;
    /**
     * GET /api/workflows/n8n/:id - Get workflow by ID
     */
    getWorkflow(id: string): Promise<{
        success: boolean;
        data: import("@the-new-fuse/n8n-workflows").N8nWorkflow;
    }>;
    /**
     * GET /api/workflows/n8n/:id/similar - Get similar workflows
     */
    getSimilarWorkflows(id: string, limit?: string): Promise<{
        success: boolean;
        data: {
            workflows: import("@the-new-fuse/n8n-workflows").N8nWorkflow[];
        };
    }>;
    /**
     * GET /api/workflows/n8n/category/:category - Get workflows by category
     */
    getByCategory(category: WorkflowCategory): Promise<{
        success: boolean;
        data: {
            workflows: import("@the-new-fuse/n8n-workflows").N8nWorkflow[];
        };
    }>;
    /**
     * GET /api/workflows/n8n/tag/:tag - Get workflows by tag
     */
    getByTag(tag: string): Promise<{
        success: boolean;
        data: {
            workflows: import("@the-new-fuse/n8n-workflows").N8nWorkflow[];
        };
    }>;
    /**
     * POST /api/workflows/n8n/sync - Sync workflows from repositories
     */
    syncWorkflows(): Promise<{
        success: boolean;
        data: {
            success: boolean;
            totalWorkflows: number;
            stats: import("@the-new-fuse/n8n-workflows").WorkflowStats;
            errors: string[];
        };
    }>;
    /**
     * POST /api/workflows/n8n/import - Import workflow to n8n instance
     */
    importWorkflow(request: WorkflowImportRequest): Promise<{
        success: boolean;
        data: import("@the-new-fuse/n8n-workflows").WorkflowImportResponse;
    }>;
    /**
     * GET /api/workflows/n8n/search - Search workflows
     */
    searchWorkflows(q: string, limit?: string, offset?: string): Promise<{
        success: boolean;
        data: import("@the-new-fuse/n8n-workflows").WorkflowSearchResult;
    }>;
}
//# sourceMappingURL=n8n-workflows.controller.d.ts.map