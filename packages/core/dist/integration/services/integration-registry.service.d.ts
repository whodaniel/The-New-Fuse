export interface IntegrationMetadata {
    id: string;
    name: string;
    description: string;
    version: string;
    status: 'active' | 'inactive' | 'deprecated';
    category: string;
    tags: string[];
}
export declare class IntegrationRegistryService {
    private readonly logger;
    private readonly integrations;
    registerIntegration(metadata: IntegrationMetadata): void;
    unregisterIntegration(id: string): boolean;
    getIntegration(id: string): IntegrationMetadata | undefined;
    listIntegrations(): IntegrationMetadata[];
    findIntegrationsByCategory(category: string): IntegrationMetadata[];
    findIntegrationsByTag(tag: string): IntegrationMetadata[];
}
//# sourceMappingURL=integration-registry.service.d.ts.map