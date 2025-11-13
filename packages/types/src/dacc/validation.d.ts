/**
 * DACC Schema Validation Utilities
 */
import type { WorkflowDefinition } from './schemas';
/**
 * Validation result interface
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}
/**
 * Validate AgentDefinition schema
 */
export declare function validateAgentDefinition(agent: any): ValidationResult;
/**
 * Validate WorkflowDefinition schema
 */
export declare function validateWorkflowDefinition(workflow: any): ValidationResult;
/**
 * Validate WorkflowStep schema
 */
export declare function validateWorkflowStep(step: any): ValidationResult;
/**
 * Validate SystemBlueprint schema
 */
export declare function validateSystemBlueprint(blueprint: any): ValidationResult;
/**
 * Validate StreamPacket schema
 */
export declare function validateStreamPacket(packet: any): ValidationResult;
/**
 * Validate that all workflow step references exist
 */
export declare function validateWorkflowReferences(workflow: WorkflowDefinition): ValidationResult;
//# sourceMappingURL=validation.d.ts.map