export class WorkflowGateway {
    constructor(apiManager, integrationRegistry) {
        this.apiManager = apiManager;
        this.integrationRegistry = integrationRegistry;
    }
    async registerExternalService(service) {
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
        }
        catch (error) {
            throw new Error(`Failed to register service ${service.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async makeAPICall(request) {
        try {
            // Implementation would make actual API call
            return {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: { success: true }
            };
        }
        catch (error) {
            return {
                status: 500,
                headers: { "Content-Type": "application/json" },
                body: {
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async handleWebhook(request) {
        try {
            // Implementation would process webhook
            return {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: { received: true }
            };
        }
        catch (error) {
            return {
                status: 500,
                headers: { "Content-Type": "application/json" },
                body: {
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async getServiceStatus(serviceId) {
        // Implementation would check service health
        return {
            status: 'active',
            lastCheck: new Date()
        };
    }
}
//# sourceMappingURL=gateway.js.map