/**
 * Infrastructure Manager Implementation
 * Core implementation for infrastructure management operations
 */
import { IInfrastructureManager } from '../interfaces/IInfrastructureManager';
import { InfrastructureTemplate, ProvisionResult } from '../types/infrastructure';
import { TemplateParser } from './TemplateParser';
import { StateManager } from './StateManager';
import { ResourceProvisioner } from './ResourceProvisioner';
import { TemplateValidator } from './TemplateValidator';
import { ChangeAnalyzer } from './ChangeAnalyzer';
import { MetricsCollector } from '../core/MetricsCollector';
export declare class InfrastructureManager implements IInfrastructureManager {
    private templateParser;
    private stateManager;
    private resourceProvisioner;
    private templateValidator;
    private changeAnalyzer;
    private metricsCollector;
    constructor(templateParser: TemplateParser, stateManager: StateManager, resourceProvisioner: ResourceProvisioner, templateValidator: TemplateValidator, changeAnalyzer: ChangeAnalyzer, metricsCollector: MetricsCollector);
    provisionInfrastructure(template: InfrastructureTemplate): Promise<ProvisionResult>;
    catch(error: any): {
        success: boolean;
        planId: any;
        infrastructureId: any;
        changesApplied: never[];
        duration: number;
        finalState: any;
        error: string;
        warnings: never[];
    };
}
//# sourceMappingURL=InfrastructureManager.d.ts.map