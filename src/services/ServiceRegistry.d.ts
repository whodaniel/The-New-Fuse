import { BaseService } from './core/BaseService.js';
import { AgentService } from './agent/AgentService.js';
import { WorkflowService } from './workflow/WorkflowService.js';
export declare class ServiceRegistry extends BaseService {
  private readonly agentService;
  private readonly workflowService;
  private services;
  constructor(agentService: AgentService, workflowService: WorkflowService);
  protected doInitialize(): Promise<void>;
  private register;
  getService<T extends BaseService>(name: string): T;
  shutdown(): Promise<void>;
}
