/**
 * WorkflowParser
 * Parses n8n workflow JSON files and extracts metadata
 */
import type { N8nWorkflow, WorkflowAnalysis, WorkflowNode, WorkflowSource } from '../types/index.js';
export declare class WorkflowParser {
    /**
     * Parse a workflow JSON file
     */
    parseWorkflow(workflowJson: any, source: WorkflowSource, filePath?: string): N8nWorkflow | null;
    /**
     * Validate workflow structure
     */
    private isValidWorkflow;
    /**
     * Extract nodes from workflow
     */
    private extractNodes;
    /**
     * Extract trigger nodes
     */
    private extractTriggers;
    /**
     * Determine trigger type
     */
    private determineTriggerType;
    /**
     * Extract metadata
     */
    private extractMetadata;
    /**
     * Generate unique workflow ID
     */
    private generateWorkflowId;
    /**
     * Simple hash function
     */
    private simpleHash;
    /**
     * Extract description
     */
    private extractDescription;
    /**
     * Extract tags
     */
    private extractTags;
    /**
     * Extract use cases from workflow
     */
    private extractUseCases;
    /**
     * Analyze workflow complexity and structure
     */
    analyzeWorkflow(nodes: WorkflowNode[]): WorkflowAnalysis;
    /**
     * Extract node type information
     */
    private extractNodeTypes;
    /**
     * Get display name from node type
     */
    private getDisplayName;
    /**
     * Get category from node type
     */
    private getCategoryFromNodeType;
    /**
     * Extract required credentials
     */
    private extractRequiredCredentials;
    /**
     * Extract API services used
     */
    private extractApiServices;
    /**
     * Calculate workflow complexity
     */
    private calculateComplexity;
    /**
     * Batch parse workflows
     */
    parseWorkflows(workflows: any[], source: WorkflowSource): N8nWorkflow[];
}
//# sourceMappingURL=WorkflowParser.d.ts.map