import { PipelineDefinition, DeploymentConfig } from '../types/pipeline.js';
import { Logger } from 'winston';
/**
 * Pipeline Validator ensures pipeline configurations are valid and safe to execute
 */
export declare class PipelineValidator {
    private logger;
    constructor(logger: Logger);
    /**
     * Validate a complete pipeline definition
     */
    validatePipeline(pipeline: PipelineDefinition): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * Validate a deployment configuration
     */
    validateDeployment(deployment: DeploymentConfig): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    private validateBasicStructure;
    private validateStages;
    private validateTasks;
    private validateTaskParameters;
    private validateTriggers;
    private validateEnvironment;
    private validateQualityGates;
    private validateNotifications;
    private validateStageDependencies;
    private validateTimeoutAndRetry;
    private validateSecurity;
    private validateResources;
    private validateStageConditions;
    private validateTaskConditions;
    private validateRetryPolicy;
    private validateTaskArtifacts;
    private validateDeploymentBasics;
    private validateServices;
    private validateDeploymentStrategy;
    private validateCanaryConfig;
    private validateBlueGreenConfig;
    private validateHealthChecks;
    private validateRollbackPolicy;
    private validateApprovals;
    private hasCircularDependencies;
    private isValidResourceQuantity;
    private isValidDuration;
    private containsHardcodedSecrets;
    private containsDangerousCommands;
    private requiresPrivilegeEscalation;
}
//# sourceMappingURL=PipelineValidator.d.ts.map