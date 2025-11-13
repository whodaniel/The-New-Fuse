import { Integration, IntegrationType, IntegrationConfig, AuthType } from '../types';
interface TwitterConfig extends IntegrationConfig {
    id: string;
    name: string;
    type: IntegrationType;
    description: string;
    baseUrl: string;
    defaultHeaders: Record<string, string>;
    bearerToken?: string;
    authType: AuthType;
    webhookSupport?: boolean;
    apiVersion?: string;
    docUrl?: string;
    logoUrl?: string;
}
/**
 * Twitter/X API integration
 */
export declare class TwitterIntegration implements Integration {
    id: string;
    name: string;
    type: IntegrationType;
    description?: string;
    config: TwitterConfig;
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
    constructor(config: TwitterConfig);
    /**
     * Post a tweet
     */
    private postTweet;
    /**
     * Delete a tweet
     */
    private deleteTweet;
    /**
     * Get tweets for a user
     */
    private getUserTweets;
    /**
     * Get followers list for a user
     */
    private getUserFollowers;
    /**
     * Get following list for a user
     */
    private getUserFollowing;
}
/**
 * Create a new Twitter integration
 */
export declare function createTwitterIntegration(config?: Partial<TwitterConfig>): TwitterIntegration;
export {};
//# sourceMappingURL=twitter.d.ts.map