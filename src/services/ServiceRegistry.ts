import { Injectable } from '@nestjs/common';
import { BaseService } from './core/BaseService.js';
import { AgentService } from './agent/AgentService.js';
import { WorkflowService } from './workflow/WorkflowService.js';

@Injectable()
export class ServiceRegistry extends BaseService {
    private services: Map<string, BaseService> = new Map();

    constructor(
        private readonly agentService: AgentService,
        private readonly workflowService: WorkflowService
    ) {
        super('ServiceRegistry');
        // Register core services
        this.register('agent', this.agentService);
        this.register('workflow', this.workflowService);
    }

    protected async doInitialize(): Promise<void> {
        // Initialize all services
        for (const service of this.services.values()) {
            await service.initialize();
        }
    }

    private register(name: string, service: BaseService): void {
        if (this.services.has(name)) {
            throw new Error(`Service already registered: ${name}`);
        }
        this.services.set(name, service);
    }

    getService<T extends BaseService>(name: string): T {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service not found: ${name}`);
        }
        return service as T;
    }

    async shutdown(): Promise<void> {
        for (const service of this.services.values()) {
            await service.shutdown?.();
        }
        this.services.clear();
    }
}