import { WorkflowRegistry } from '../managers/workflow-registry';
import { ServiceRegistryService } from /../discovery/service-registry.service;
export declare class WorkflowOrchestratorService {
    private workflowRegistry;
    private serviceRegistry;
    constructor(workflowRegistry: WorkflowRegistry, serviceRegistry: ServiceRegistryService);
    orchestrateWorkflow(): Promise<void>;
}
