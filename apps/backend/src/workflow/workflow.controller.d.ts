import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
interface N8nWorkflow {
    nodes: any[];
    connections: Record<string, any>;
}
export declare class WorkflowController {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    constructor(httpService: HttpService, configService: ConfigService);
    createWorkflow(workflow: N8nWorkflow): Promise<any>;
    getWorkflows(): Promise<any>;
    getWorkflow(id: string): Promise<any>;
    updateWorkflow(id: string, workflow: N8nWorkflow): Promise<any>;
    deleteWorkflow(id: string): Promise<any>;
}
export {};
