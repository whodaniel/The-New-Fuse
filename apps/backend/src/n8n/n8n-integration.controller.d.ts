import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { N8nMetadataService } from './n8n-metadata.service.js';
export declare class N8nIntegrationController {
    private readonly httpService;
    private readonly configService;
    private readonly metadataService;
    private readonly logger;
    private readonly validator;
    constructor(httpService: HttpService, configService: ConfigService, metadataService: N8nMetadataService);
    createWorkflow(workflowData: any): Promise<any>;
    getNodeTypes(): Promise<any>;
    getNodeTypeDescription(type: string): Promise<any>;
    getCredentials(type: string): Promise<any>;
    testWorkflow(workflowData: any): Promise<any>;
}
