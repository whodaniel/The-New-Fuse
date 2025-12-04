export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface WorkflowValidationOptions {
    checkCircularDependencies?: boolean;
    checkRequiredParameters?: boolean;
    checkConnections?: boolean;
    strictMode?: boolean;
}
/**
 * Validates an N8n workflow structure
 */
export declare function validateN8nWorkflow(workflow: any, options?: WorkflowValidationOptions): ValidationResult;
/**
 * Creates a dynamic validator for specific node types
 */
export declare function createDynamicValidator(nodeType: string): (parameters: any) => ValidationResult;
/**
 * Validates ReactFlow data structure
 */
export declare function validateReactFlowData(nodes: any[], edges: any[]): ValidationResult;
declare const _default: {
    validateN8nWorkflow: typeof validateN8nWorkflow;
    createDynamicValidator: typeof createDynamicValidator;
    validateReactFlowData: typeof validateReactFlowData;
};
export default _default;
