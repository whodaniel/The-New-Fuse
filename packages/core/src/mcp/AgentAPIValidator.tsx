import { APISpec } from '../agents/types/workflow.types.js';
import { AgentMetadata } from '../types/agent.metadata.js';

export class AgentAPIValidator {
    /**
     * Validates API registration and updates agent metadata
     */
    async validateAndUpdateMetadata(
        agentId: string,
        apiSpec: APISpec,
        metadata: AgentMetadata
    ): Promise<AgentMetadata> {
        // Create new API capability record
        const apiCapability = {
            type: 'api',
            name: this.generateCapabilityName(apiSpec),
            spec: apiSpec,
            registeredAt: new Date().toISOString()
        };

        // Update agent metadata
        const updatedMetadata = {
            ...metadata,
            capabilities: [
                ...(metadata.capabilities || []),
                apiCapability
            ]
        };

        // Add API-specific expertise areas if from OpenAPI spec
        if (apiSpec.specUrl) {
            const apiDomain = new URL(apiSpec.specUrl).hostname;
            updatedMetadata.expertiseAreas = [
                ...(metadata.expertiseAreas || []),
                {
                    domain: apiDomain,
                    level: 'expert',
                    source: 'api_integration'
                }
            ];
        }

        return updatedMetadata;
    }

    /**
     * Generate a unique capability name for the API
     */
    private generateCapabilityName(apiSpec: APISpec): string {
        if (apiSpec.specUrl) {
            const url = new URL(apiSpec.specUrl);
            return `api_${url.hostname.replace(/[^a-zA-Z0-9]/g, '_')}`;
        }
        
        // For manual endpoint definitions, use first endpoint
        if (apiSpec.endpoints && apiSpec.endpoints.length > 0) {
            const firstEndpoint = apiSpec.endpoints[0];
            return `api_${firstEndpoint.method.toLowerCase()}_${firstEndpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}`;
        }

        return `api_${Date.now()}`;
    }

    /**
     * Validate OpenAPI spec URL is accessible
     */
    async validateOpenAPISpec(specUrl: string): Promise<boolean> {
        try {
            const response = await fetch(specUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch OpenAPI spec: ${response.statusText}`);
            }
            const spec = await response.json();
            
            // Basic validation of OpenAPI spec
            return !!(spec.openapi || spec.swagger) && !!spec.paths;
        } catch (error) {
            throw new Error(`Invalid OpenAPI specification: ${error.message}`);
        }
    }
}