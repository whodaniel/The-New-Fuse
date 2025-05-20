// Import required API client and types
import { ApiClient } from '../../core/ApiClient.js';
import { ApiConfig } from '../../config/ApiConfig.js';
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
export class TwitterIntegration implements Integration {
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
  isConnected: boolean = false;
  isEnabled: boolean = true;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
  
  private apiClient: ApiClient;
  
  constructor(config: TwitterConfig) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.description = config.description;
    this.config = config;
    
    // Default Twitter capabilities
    this.capabilities = {
      actions: [
        'post_tweet',
        'delete_tweet',
        'get_user_tweets',
        'get_user_profile',
        'get_user_followers',
        'get_user_following',
        'follow_user',
        'unfollow_user',
        'search_tweets',
        'get_trends',
        'like_tweet',
        'unlike_tweet',
        'retweet',
        'unretweet',
        'upload_media'
      ],
      triggers: [
        'new_tweet_by_user',
        'new_mention',
        'new_follower',
        'new_direct_message'
      ],
      supportsWebhooks: true,
      supportsPolling: true
    };
    
    // Create API client for Twitter API v2
    const apiConfig: ApiConfig = {
      baseURL: config.baseUrl,
      headers: {
        ...config.defaultHeaders,
        'Content-Type': 'application/json'
      }
    };
    
    // Add bearer token if provided
    if (config.bearerToken) {
      apiConfig.headers = {
        ...apiConfig.headers,
        'Authorization': `Bearer ${config.bearerToken}`
      };
    }
    
    this.apiClient = new ApiClient(apiConfig);
  }
  
  /**
   * Connect to Twitter API
   */
  async connect(): Promise<boolean> {
    try {
      // Verify credentials by making a test request
      const result = await this.apiClient.get('/2/users/me');
      this.isConnected = true;
      this.updatedAt = new Date();
      return true;
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Disconnect from Twitter API
   */
  async disconnect(): Promise<boolean> {
    this.isConnected = false;
    this.updatedAt = new Date();
    return true;
  }
  
  /**
   * Execute a Twitter API action
   */
  async execute(action: string, params: Record<string, any>): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Not connected to Twitter API. Call connect() first.');
    }
    
    switch (action) {
      case 'post_tweet':
        return this.postTweet(params.text, params.reply_to, params.media_ids);
      case 'delete_tweet':
        return this.deleteTweet(params.tweet_id);
      case 'get_user_tweets':
        return this.getUserTweets(params.user_id, params.max_results);
      case 'get_user_profile':
        return this.getUserProfile(params.user_id || params.username);
      case 'get_user_followers':
        return this.getUserFollowers(params.user_id, params.max_results);
      case 'get_user_following':
        return this.getUserFollowing(params.user_id, params.max_results);
      case 'follow_user':
        return this.followUser(params.target_user_id);
      case 'unfollow_user':
        return this.unfollowUser(params.target_user_id);
      case 'search_tweets':
        return this.searchTweets(params.query, params.max_results);
      case 'get_trends':
        return this.getTrends(params.woeid || 1);
      case 'like_tweet':
        return this.likeTweet(params.tweet_id);
      case 'unlike_tweet':
        return this.unlikeTweet(params.tweet_id);
      case 'retweet':
        return this.retweet(params.tweet_id);
      case 'unretweet':
        return this.unretweet(params.tweet_id);
      case 'upload_media':
        return this.uploadMedia(params.media_data, params.media_type);
      default:
        throw new Error(`Unsupported Twitter action: ${action}`);
    }
  }
  
  /**
   * Post a tweet
   */
  private async postTweet(text: string, reply_to?: string, media_ids?: string[]): Promise<any> {
    try {
      const payload: any = { text };
      
      if (reply_to) {
        payload.reply = { in_reply_to_tweet_id: reply_to };
      }
      
      if (media_ids && media_ids.length > 0) {
        payload.media = { media_ids };
      }
      
      return await this.apiClient.post('/2/tweets', payload);
    } catch (error) {
      throw new Error(`Failed to post tweet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Delete a tweet
   */
  private async deleteTweet(tweet_id: string): Promise<any> {
    try {
      return await this.apiClient.delete(`/2/tweets/${tweet_id}`);
    } catch (error) {
      throw new Error(`Failed to delete tweet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get tweets for a user
   */
  private async getUserTweets(user_id: string, max_results = 10): Promise<any> {
    try {
      return await this.apiClient.get(`/2/users/${user_id}/tweets?max_results=${max_results}`);
    } catch (error) {
      throw new Error(`Failed to get user tweets: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get user profile information
   */
  private async getUserProfile(user_identifier: string): Promise<any> {
    try {
      // Check if the identifier is numeric (user_id) or a username
      const isUserId = /^\d+$/.test(user_identifier);
      const endpoint = isUserId 
        ? `/2/users/${user_identifier}` 
        : `/2/users/by/username/${user_identifier}`;
        
      return await this.apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get followers list for a user
   */
  private async getUserFollowers(user_id: string, max_results = 100): Promise<any> {
    try {
      return await this.apiClient.get(`/2/users/${user_id}/followers?max_results=${max_results}`);
    } catch (error) {
      throw new Error(`Failed to get user followers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get following list for a user
   */
  private async getUserFollowing(user_id: string, max_results = 100): Promise<any> {
    try {
      return await this.apiClient.get(`/2/users/${user_id}/following?max_results=${max_results}`);
    } catch (error) {
      throw new Error(`Failed to get user following: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Follow a user
   */
  private async followUser(target_user_id: string): Promise<any> {
    try {
      // Need user ID of authenticated user
      const me = await this.apiClient.get('/2/users/me');
      const userId = me.data.id;
      
      return await this.apiClient.post(`/2/users/${userId}/following`, {
        target_user_id
      });
    } catch (error) {
      throw new Error(`Failed to follow user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Unfollow a user
   */
  private async unfollowUser(target_user_id: string): Promise<any> {
    try {
      // Need user ID of authenticated user
      const me = await this.apiClient.get('/2/users/me');
      const userId = me.data.id;
      
      return await this.apiClient.delete(`/2/users/${userId}/following/${target_user_id}`);
    } catch (error) {
      throw new Error(`Failed to unfollow user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Search for tweets
   */
  private async searchTweets(query: string, max_results = 10): Promise<any> {
    try {
      const encodedQuery = encodeURIComponent(query);
      return await this.apiClient.get(`/2/tweets/search/recent?query=${encodedQuery}&max_results=${max_results}`);
    } catch (error) {
      throw new Error(`Failed to search tweets: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get trending topics
   */
  private async getTrends(woeid = 1): Promise<any> {
    try {
      // This uses the v1.1 API as trends are not yet in v2
      return await this.apiClient.get(`/1.1/trends/place.json?id=${woeid}`);
    } catch (error) {
      throw new Error(`Failed to get trends: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Like a tweet
   */
  private async likeTweet(tweet_id: string): Promise<any> {
    try {
      // Need user ID of authenticated user
      const me = await this.apiClient.get('/2/users/me');
      const userId = me.data.id;
      
      return await this.apiClient.post(`/2/users/${userId}/likes`, {
        tweet_id
      });
    } catch (error) {
      throw new Error(`Failed to like tweet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Unlike a tweet
   */
  private async unlikeTweet(tweet_id: string): Promise<any> {
    try {
      // Need user ID of authenticated user
      const me = await this.apiClient.get('/2/users/me');
      const userId = me.data.id;
      
      return await this.apiClient.delete(`/2/users/${userId}/likes/${tweet_id}`);
    } catch (error) {
      throw new Error(`Failed to unlike tweet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Retweet a tweet
   */
  private async retweet(tweet_id: string): Promise<any> {
    try {
      // Need user ID of authenticated user
      const me = await this.apiClient.get('/2/users/me');
      const userId = me.data.id;
      
      return await this.apiClient.post(`/2/users/${userId}/retweets`, {
        tweet_id
      });
    } catch (error) {
      throw new Error(`Failed to retweet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Undo a retweet
   */
  private async unretweet(tweet_id: string): Promise<any> {
    try {
      // Need user ID of authenticated user
      const me = await this.apiClient.get('/2/users/me');
      const userId = me.data.id;
      
      return await this.apiClient.delete(`/2/users/${userId}/retweets/${tweet_id}`);
    } catch (error) {
      throw new Error(`Failed to unretweet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Upload media (this still uses v1.1 API)
   */
  private async uploadMedia(media_data: string, media_type: string): Promise<any> {
    try {
      return await this.apiClient.post('https://upload.twitter.com/1.1/media/upload.json', {
        media_data,
        media_type
      });
    } catch (error) {
      throw new Error(`Failed to upload media: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get metadata about this integration
   */
  async getMetadata(): Promise<Record<string, any>> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      capabilities: this.capabilities,
      isConnected: this.isConnected,
      isEnabled: this.isEnabled,
      lastUpdated: this.updatedAt
    };
  }
}

/**
 * Create a new Twitter integration
 */
export function createTwitterIntegration(config: Partial<TwitterConfig> = {}): TwitterIntegration {
  const defaultConfig: TwitterConfig = {
    id: 'twitter',
    name: 'Twitter',
    type: (IntegrationType as any).SOCIAL || 'social',
    description: 'Integrate with Twitter/X for posting, monitoring and engagement',
    baseUrl: 'https://api.twitter.com',
    defaultHeaders: {},
    authType: AuthType.OAUTH2,
    webhookSupport: true,
    apiVersion: 'v2',
    docUrl: 'https://developer.twitter.com/en/docs/twitter-api',
    logoUrl: 'https://about.twitter.com/content/dam/about-twitter/x/brand-toolkit/logo-black.png.twimg.1920.png'
  };
  
  return new TwitterIntegration({
    ...defaultConfig,
    ...config
  });
}