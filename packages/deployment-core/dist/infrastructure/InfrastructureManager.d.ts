/**
 * Infrastructure Manager Implementation
 * Core implementation for infrastructure management operations
 */
import { IInfrastructureManager, InfrastructureFilters, InfrastructureImportConfig, InfrastructureMetrics } from '../interfaces/IInfrastructureManager.js';
import { InfrastructureTemplate, InfrastructureUpdate, InfrastructureChange, ExecutionPlan, ProvisionResult, UpdateResult, DestroyResult, ValidationResult, PlanResult, ApplyResult, InfrastructureState } from '../types/infrastructure.js';
import { TemplateParser } from './TemplateParser.js';
import { StateManager } from './StateManager.js';
import { ResourceProvisioner } from './ResourceProvisioner.js';
import { TemplateValidator } from './TemplateValidator.js';
import { ChangeAnalyzer } from './ChangeAnalyzer.js';
import { MetricsCollector } from '../core/MetricsCollector.js';
export declare class InfrastructureManager implements IInfrastructureManager {
    private templateParser;
    private stateManager;
    private resourceProvisioner;
    private templateValidator;
    private changeAnalyzer;
    private metricsCollector;
    constructor(templateParser: TemplateParser, stateManager: StateManager, resourceProvisioner: ResourceProvisioner, templateValidator: TemplateValidator, changeAnalyzer: ChangeAnalyzer, metricsCollector: MetricsCollector);
    provisionInfrastructure(template: InfrastructureTemplate): Promise<ProvisionResult>;
    updateInfrastructure(update: InfrastructureUpdate): Promise<UpdateResult>;
    destroyInfrastructure(resourceId: string): Promise<DestroyResult>;
    validateTemplate(template: InfrastructureTemplate): Promise<ValidationResult>;
    planChanges(changes: InfrastructureChange[]): Promise<PlanResult>;
    applyChanges(plan: ExecutionPlan): Promise<ApplyResult>;
    getInfrastructureState(infrastructureId: string): Promise<InfrastructureState>;
    listInfrastructure(filters?: InfrastructureFilters): Promise<InfrastructureState[]>;
    importInfrastructure(importConfig: InfrastructureImportConfig): Promise<ProvisionResult>;
    exportInfrastructure(infrastructureId: string): Promise<InfrastructureTemplate>;
    lockInfrastructure(infrastructureId: string, lockReason: string): Promise<void>;
    unlockInfrastructure(infrastructureId: string): Promise<void>;
    getInfrastructureMetrics(infrastructureId: string): Promise<InfrastructureMetrics>;
    refreshState(infrastructureId: string): Promise<InfrastructureState>;
    private generateId;
    private extractEnvironment;
    private calculateChecksum;
}
//# sourceMappingURL=InfrastructureManager.d.ts.map