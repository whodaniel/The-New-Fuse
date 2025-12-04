/**
 * Workflow Templates for The New Fuse
 * Pre-built workflow templates that users can import and customize
 */
export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number;
    nodes: any[];
    edges: any[];
    tags: string[];
}
export declare const workflowTemplates: WorkflowTemplate[];
export declare function getTemplateById(id: string): WorkflowTemplate | undefined;
export declare function getTemplatesByCategory(category: string): WorkflowTemplate[];
export declare function getTemplatesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): WorkflowTemplate[];
export declare function searchTemplates(query: string): WorkflowTemplate[];
