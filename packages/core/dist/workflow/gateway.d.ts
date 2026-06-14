export interface APIManager {
    validateAPISpec(spec: any): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    createIntegration(service: any, spec: any): Promise<any>;
}
export interface IntegrationRegistry {
    registerIntegration(integration: any): Promise<any>;
}
export interface ExternalService {
    id: string;
    name: string;
    spec: any;
}
export interface APIRequest {
    path: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
}
export interface APIResponse {
    status: number;
    headers: Record<string, string>;
    body: any;
}
export declare class WorkflowGateway {
    private apiManager;
    private integrationRegistry;
    constructor(apiManager: APIManager, integrationRegistry: IntegrationRegistry);
    registerExternalService(service: ExternalService): Promise<void>;
    makeAPICall(request: APIRequest): Promise<APIResponse>;
    handleWebhook(request: APIRequest): Promise<APIResponse>;
    getServiceStatus(serviceId: string): Promise<{
        status: 'active' | 'inactive' | 'error';
        lastCheck: Date;
    }>;
}
//# sourceMappingURL=gateway.d.ts.map