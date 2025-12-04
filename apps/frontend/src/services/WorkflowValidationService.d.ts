/**
 * Workflow Validation Service - Comprehensive workflow validation
 */
import { Node } from 'reactflow';
import { Workflow } from './WorkflowService';
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
export interface ValidationError {
    id: string;
    type: 'structure' | 'node' | 'edge' | 'configuration' | 'dependency';
    severity: 'error' | 'warning';
    message: string;
    nodeId?: string;
    edgeId?: string;
    details?: Record<string, any>;
}
export interface ValidationWarning extends ValidationError {
    severity: 'warning';
}
declare class WorkflowValidationService {
    validateWorkflow(workflow: Workflow): Promise<ValidationResult>;
    private validateStructure;
    private validateNode;
    private validateAgentNode;
    private validateMCPToolNode;
    private validateConditionNode;
    private validateLoopNode;
    private validateSubworkflowNode;
    private validateEdge;
    private validateWorkflowLogic;
    private detectCycles;
    private generatePerformanceWarnings;
    private calculateMaxDepth;
    validateNodeConfiguration(node: Node): ValidationError[];
    validateEdgeConnection(sourceNode: Node, targetNode: Node): ValidationError[];
}
export declare const workflowValidationService: WorkflowValidationService;
export default WorkflowValidationService;
