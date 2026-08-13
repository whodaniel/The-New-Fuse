// @ts-nocheck
/**
 * Workflow Validator - Schema and Logic Validation
 *
 * Provides comprehensive validation for workflows, nodes, and configurations
 * Integrates with The New Fuse framework requirements and standards
 */
import { Logger } from '@the-new-fuse/relay-core';
import { UnifiedWorkflow, WorkflowNodeType, WorkflowValidationResult, ValidationError, NodeConfiguration } from '../types/WorkflowTypes.js';
export interface ValidatorConfig {
    strictMode: boolean;
    maxNodes: number;
    maxConnections: number;
    maxVariables: number;
    allowCircularReferences: boolean;
    requireStartNode: boolean;
    requireEndNode: boolean;
    enablePerformanceValidation: boolean;
}
export declare class WorkflowValidator {
    private logger;
    private config;
    private validationRules;
    private warningRules;
    constructor(config: ValidatorConfig, logger: Logger);
    /**
     * Validate complete workflow
     */
    validateWorkflow(workflow: UnifiedWorkflow): Promise<WorkflowValidationResult>;
    /**
     * Validate workflow definition
     */
    private validateWorkflowDefinition;
    /**
     * Validate individual node
     */
    private validateNode;
    /**
     * Validate node configuration based on type
     */
    private validateNodeConfiguration;
    private validateAgentTaskNode;
    private validateAgentHandoffNode;
    private validateConditionNode;
    private validateLLMPromptNode;
    private validateAPICallNode;
    /**
     * Validate node inputs and outputs
     */
    private validateNodeInputsOutputs;
    /**
     * Validate connection
     */
    private validateConnection;
    /**
     * Validate variable
     */
    private validateVariable;
    private validateVariableValue;
    /**
     * Initialize validation rules
     */
    private initializeValidationRules;
    /**
     * Initialize warning rules
     */
    private initializeWarningRules;
    /**
     * Generate performance warnings
     */
    private generatePerformanceWarnings;
    private calculateMaxDepth;
    private calculateComplexity;
    /**
     * Public API methods
     */
    validateNodeConfig(nodeType: WorkflowNodeType, config: NodeConfiguration): Promise<ValidationError[]>;
    getValidationRules(): string[];
    addCustomValidationRule(name: string, rule: (workflow: UnifiedWorkflow) => ValidationError[]): void;
    removeValidationRule(name: string): boolean;
}
//# sourceMappingURL=WorkflowValidator.d.ts.map