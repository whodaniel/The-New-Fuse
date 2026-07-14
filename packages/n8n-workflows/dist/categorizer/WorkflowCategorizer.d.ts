/**
 * WorkflowCategorizer
 * Categorizes n8n workflows based on their content, nodes, and metadata
 */
import type { N8nWorkflow, WorkflowCategory, CategoryConfig } from '../types/index.js';
export declare class WorkflowCategorizer {
    private categoryConfigs;
    /**
     * Categorize a workflow
     */
    categorize(workflow: N8nWorkflow): WorkflowCategory;
    /**
     * Categorize multiple workflows
     */
    categorizeWorkflows(workflows: N8nWorkflow[]): N8nWorkflow[];
    /**
     * Get category statistics
     */
    getCategoryStats(workflows: N8nWorkflow[]): {
        [key in WorkflowCategory]?: number;
    };
    /**
     * Get all category configs
     */
    getCategoryConfigs(): CategoryConfig[];
    /**
     * Get category config by name
     */
    getCategoryConfig(category: WorkflowCategory): CategoryConfig | undefined;
    /**
     * Suggest categories for a workflow
     */
    suggestCategories(workflow: N8nWorkflow, topN?: number): Array<{
        category: WorkflowCategory;
        score: number;
        confidence: number;
    }>;
    /**
     * Calculate confidence score
     */
    private calculateConfidence;
}
//# sourceMappingURL=WorkflowCategorizer.d.ts.map