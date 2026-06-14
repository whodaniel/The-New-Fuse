import { Integration, IntegrationType, IntegrationConfig, AuthType } from '../types.js';
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
     * Connect to Twitter API
     */
    connect(): Promise<boolean>;
    /**
     * Disconnect from Twitter API
     */
    disconnect(): Promise<boolean>;
    /**
     * Execute a Twitter API action
     */
    execute(action: string, params: Record<string, any>): Promise<any>;
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
     * Get user profile information
     */
    private getUserProfile;
    /**
     * Get followers list for a user
     */
    private getUserFollowers;
    /**
     * Get following list for a user
     */
    private getUserFollowing;
    /**
     * Follow a user
     */
    private followUser;
    /**
     * Unfollow a user
     */
    private unfollowUser;
    /**
     * Search for tweets
     */
    private searchTweets;
    /**
     * Get trending topics
     */
    private getTrends;
    /**
     * Like a tweet
     */
    private likeTweet;
    /**
     * Unlike a tweet
     */
    private unlikeTweet;
    /**
     * Retweet a tweet
     */
    private retweet;
    /**
     * Undo a retweet
     */
    private unretweet;
    /**
     * Upload media (this still uses v1.1 API)
     */
    private uploadMedia;
    /**
     * Get metadata about this integration
     */
    getMetadata(): Promise<Record<string, any>>;
}
/**
 * Create a new Twitter integration
 */
export declare function createTwitterIntegration(config?: Partial<TwitterConfig>): TwitterIntegration;
export {};
//# sourceMappingURL=twitter.d.ts.map