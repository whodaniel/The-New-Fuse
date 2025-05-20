import { WorkflowRegistry } from '../managers/workflow-registry.js';
import { ServiceRegistryService } from '../discovery/service-registry.service.js';
export declare class WorkflowOrchestratorService {
    private workflowRegistry;
    private serviceRegistry;
    constructor(workflowRegistry: WorkflowRegistry, serviceRegistry: ServiceRegistryService);
    orchestrateWorkflow(): Promise<void>;
}
