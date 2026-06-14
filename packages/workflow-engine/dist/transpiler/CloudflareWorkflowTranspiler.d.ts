import { UnifiedWorkflow } from '../types/WorkflowTypes.js';
/**
 * Enhanced Cloudflare Workflow Transpiler
 *
 * Transpiles TNF's visual ReactFlow JSON schema into an executable
 * Cloudflare Workers Workflow (AST-compatible JS/TS class).
 * Supports complex branching (conditions) and parallel execution.
 */
export declare class CloudflareWorkflowTranspiler {
    /**
     * Transpile a TNF UnifiedWorkflow into a Cloudflare Workflow Entrypoint.
     */
    transpile(workflow: UnifiedWorkflow): string;
    /**
     * Recursively generate code for a chain of nodes.
     */
    private generateNodeChain;
    private transpileNode;
    private findNode;
    private sanitizeClassName;
    private sanitizeStepName;
}
//# sourceMappingURL=CloudflareWorkflowTranspiler.d.ts.map