export interface APIManager {
  validateAPISpec(spec: any): Promise<{ valid: boolean; errors?: string[] }>;
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

export class WorkflowGateway {
  constructor(
    private apiManager: APIManager,
    private integrationRegistry: IntegrationRegistry
  ) {}

  async registerExternalService(service: ExternalService): Promise<void> {
    try {
      // Validate the API specification
      const validationResult = await this.apiManager.validateAPISpec(service.spec);
      if (!validationResult.valid) {
        throw new Error(`Invalid API spec: ${validationResult.errors?.join(', ')}`);
      }

      // Create integration
      const integration = await this.apiManager.createIntegration(service, service.spec);
      
      // Register with integration registry
      await this.integrationRegistry.registerIntegration(integration);
      
    } catch (error) {
      throw new Error(`Failed to register service ${service.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async makeAPICall(serviceId: string, request: APIRequest): Promise<APIResponse> {
    try {
      // Implementation would make actual API call
      return {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: { success: true }
      };
    } catch (error) {
      return {
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: { 
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async handleWebhook(serviceId: string, payload: any): Promise<APIResponse> {
    try {
      // Implementation would process webhook
      return {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: { received: true }
      };
    } catch (error) {
      return {
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: { 
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async getServiceStatus(serviceId: string): Promise<{ status: 'active' | 'inactive' | 'error'; lastCheck: Date }> {
    // Implementation would check service health
    return {
      status: 'active',
      lastCheck: new Date()
    };
  }
}