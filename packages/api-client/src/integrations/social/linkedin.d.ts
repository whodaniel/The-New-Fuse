import { Integration, IntegrationType, IntegrationConfig, AuthType } from '../types';
/**
 * LinkedIn API configuration
 */
export interface LinkedInConfig extends IntegrationConfig {
    id: string;
    name: string;
    type: IntegrationType;
    description: string;
    baseUrl: string;
    defaultHeaders: Record<string, string>;
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    authType: AuthType;
    webhookSupport?: boolean;
    apiVersion?: string;
    docUrl?: string;
    logoUrl?: string;
}
/**
 * LinkedIn API integration
 */
export declare class LinkedInIntegration implements Integration {
    id: string;
    name: string;
    type: IntegrationType;
    description?: string;
    config: LinkedInConfig;
    capabilities: {
        actions: string[];
        triggers?: string[];
        supportsWebhooks: boolean;
        supportsPolling: boolean;
    };
    isConnected: boolean;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    private apiClient;
    constructor(config: LinkedInConfig);
    /**
     * Create a post on LinkedIn
     */
    private createPost;
    catch(error: any): void;
}
/**
 * Create a new LinkedIn integration
 */
export declare function createLinkedInIntegration(config?: Partial<LinkedInConfig>): LinkedInIntegration;
//# sourceMappingURL=linkedin.d.ts.map