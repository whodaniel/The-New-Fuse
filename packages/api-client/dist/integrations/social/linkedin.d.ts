import { Integration, IntegrationType, IntegrationConfig, AuthType } from '../types.js';
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
     * Connect to LinkedIn API
     */
    connect(): Promise<boolean>;
    /**
     * Disconnect from LinkedIn API
     */
    disconnect(): Promise<boolean>;
    /**
     * Execute a LinkedIn API action
     */
    execute(action: string, params: Record<string, any>): Promise<any>;
    /**
     * Create a post on LinkedIn
     */
    private createPost;
    /**
     * Share an update on LinkedIn
     */
    private shareUpdate;
    /**
     * Get profile information
     */
    private getProfile;
    /**
     * Get profile ID from the cached data or fetch it
     */
    private getProfileId;
    /**
     * Get connections
     */
    private getConnections;
    /**
     * Send connection invitation
     */
    private sendInvitation;
    /**
     * Get company page information
     */
    private getCompanyPage;
    /**
     * Create a post on a company page
     */
    private createCompanyPost;
    /**
     * Get company analytics
     */
    private getAnalytics;
    /**
     * Search for people
     */
    private searchPeople;
    /**
     * Search for companies
     */
    private searchCompanies;
    /**
     * Get metadata about this integration
     */
    getMetadata(): Promise<Record<string, any>>;
}
/**
 * Create a new LinkedIn integration
 */
export declare function createLinkedInIntegration(config?: Partial<LinkedInConfig>): LinkedInIntegration;
//# sourceMappingURL=linkedin.d.ts.map