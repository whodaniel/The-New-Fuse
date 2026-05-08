// Import required API client and types
import { ApiClient } from '../../core/ApiClient.js';
import { ApiConfig } from '../../config/ApiConfig.js';
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
export class LinkedInIntegration implements Integration {
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
  isConnected: boolean = false;
  isEnabled: boolean = true;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
  
  private apiClient: ApiClient;
  
  constructor(config: LinkedInConfig) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.description = config.description;
    this.config = config;
    
    // Default LinkedIn capabilities
    this.capabilities = {
      actions: [
        'create_post',
        'share_update',
        'create_article',
        'get_profile',
        'get_connections',
        'send_invitation',
        'get_company_page',
        'create_company_post',
        'get_analytics',
        'search_people',
        'search_companies',
        'get_network_updates'
      ],
      triggers: [
        'new_connection',
        'new_message',
        'profile_view',
        'post_engagement',
        'job_application',
        'company_page_follow'
      ],
      supportsWebhooks: true,
      supportsPolling: true
    };
    
    // Create API client for LinkedIn API
    const apiConfig: ApiConfig = {
      baseURL: config.baseUrl || '',
      headers: {
        ...config.defaultHeaders,
        'Content-Type': 'application/json'
      }
    };
    
    // Add access token if provided
    if (config.accessToken) {
      apiConfig.headers = {
        ...apiConfig.headers,
        'Authorization': `Bearer ${config.accessToken}`
      };
    }
    
    this.apiClient = new ApiClient(apiConfig);
  }
  
  /**
   * Connect to LinkedIn API
   */
  async connect(): Promise<boolean> {
    try {
      // Verify credentials by making a test request to get profile info
      const result = await this.apiClient.get('/v2/me');
      this.isConnected = true;
      this.updatedAt = new Date();
      return true;
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Failed to connect to LinkedIn API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Disconnect from LinkedIn API
   */
  async disconnect(): Promise<boolean> {
    this.isConnected = false;
    this.updatedAt = new Date();
    return true;
  }
  
  /**
   * Execute a LinkedIn API action
   */
  async execute(action: string, params: Record<string, any>): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Not connected to LinkedIn API. Call connect() first.');
    }
    
    switch (action) {
      case 'create_post':
        return this.createPost(params.text, params.visibility, params.media);
      case 'share_update':
        return this.shareUpdate(params.content, params.visibility);
      case 'get_profile':
        return this.getProfile();
      case 'get_connections':
        return this.getConnections(params.start, params.count);
      case 'send_invitation':
        return this.sendInvitation(params.recipient, params.message);
      case 'get_company_page':
        return this.getCompanyPage(params.company_id);
      case 'create_company_post':
        return this.createCompanyPost(params.company_id, params.content);
      case 'get_analytics':
        return this.getAnalytics(params.company_id, params.timeRange);
      case 'search_people':
        return this.searchPeople(params.keywords, params.filters);
      case 'search_companies':
        return this.searchCompanies(params.keywords, params.filters);
      default:
        throw new Error(`Unsupported LinkedIn action: ${action}`);
    }
  }
  
  /**
   * Create a post on LinkedIn
   */
  private async createPost(text: string, visibility = 'PUBLIC', media?: any[]): Promise<any> {
    try {
      const payload: any = {
        author: `urn:li:person:${this.getProfileId()}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text
            },
            shareMediaCategory: media && media.length > 0 ? 'IMAGE' : 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': visibility
        }
      };
      
      // Add media if provided
      if (media && media.length > 0) {
        payload.specificContent['com.linkedin.ugc.ShareContent'].media = media;
      }
      
      return await this.apiClient.post('/v2/ugcPosts', payload);
    } catch (error) {
      throw new Error(`Failed to create post: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Share an update on LinkedIn
   */
  private async shareUpdate(content: any, visibility = 'PUBLIC'): Promise<any> {
    try {
      const payload = {
        content,
        distribution: {
          linkedInDistributionTarget: {}
        },
        owner: `urn:li:person:${this.getProfileId()}`,
        subject: content.title || 'Shared Update',
        text: {
          text: content.text
        }
      };
      
      return await this.apiClient.post('/v2/shares', payload);
    } catch (error) {
      throw new Error(`Failed to share update: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get profile information
   */
  private async getProfile(): Promise<any> {
    try {
      return await this.apiClient.get('/v2/me');
    } catch (error) {
      throw new Error(`Failed to get profile: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get profile ID from the cached data or fetch it
   */
  private async getProfileId(): Promise<string> {
    try {
      const profile = await this.getProfile();
      return profile.id;
    } catch (error) {
      throw new Error(`Failed to get profile ID: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get connections
   */
  private async getConnections(start = 0, count = 50): Promise<any> {
    try {
      return await this.apiClient.get(`/v2/connections?start=${start}&count=${count}`);
    } catch (error) {
      throw new Error(`Failed to get connections: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Send connection invitation
   */
  private async sendInvitation(recipient: string, message?: string): Promise<any> {
    try {
      const payload: any = {
        invitee: {
          'com.linkedin.voyager.growth.invitation.InviteeProfile': {
            profileId: recipient
          }
        }
      };
      
      if (message) {
        payload.message = {
          'com.linkedin.voyager.growth.invitation.CustomMessage': {
            body: message
          }
        };
      }
      
      return await this.apiClient.post('/v2/invitations', payload);
    } catch (error) {
      throw new Error(`Failed to send invitation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get company page information
   */
  private async getCompanyPage(companyId: string): Promise<any> {
    try {
      return await this.apiClient.get(`/v2/organizations/${companyId}`);
    } catch (error) {
      throw new Error(`Failed to get company page: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Create a post on a company page
   */
  private async createCompanyPost(companyId: string, content: any): Promise<any> {
    try {
      const payload = {
        author: `urn:li:organization:${companyId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content.text
            },
            shareMediaCategory: content.media ? 'IMAGE' : 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };
      
      // Add media if provided
      if (content.media) {
        if (payload.specificContent['com.linkedin.ugc.ShareContent']) {
          (payload.specificContent['com.linkedin.ugc.ShareContent'] as any).media = content.media;
        }
      }
      
      return await this.apiClient.post('/v2/ugcPosts', payload);
    } catch (error) {
      throw new Error(`Failed to create company post: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get company analytics
   */
  private async getAnalytics(companyId: string, timeRange: string): Promise<any> {
    try {
      return await this.apiClient.get(`/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${companyId}&timeIntervals.timeGranularityType=${timeRange}&timeIntervals.timeRange=CUSTOM&timeIntervals.startTime=1577836800000`);
    } catch (error) {
      throw new Error(`Failed to get analytics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Search for people
   */
  private async searchPeople(keywords: string, filters?: any): Promise<any> {
    try {
      let url = `/v2/people-search?keywords=${encodeURIComponent(keywords)}`;
      
      // Add any additional filters
      if (filters) {
        Object.keys(filters).forEach(key => {
          url += `&${key}=${encodeURIComponent(filters[key])}`;
        });
      }
      
      return await this.apiClient.get(url);
    } catch (error) {
      throw new Error(`Failed to search people: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Search for companies
   */
  private async searchCompanies(keywords: string, filters?: any): Promise<any> {
    try {
      let url = `/v2/company-search?keywords=${encodeURIComponent(keywords)}`;
      
      // Add any additional filters
      if (filters) {
        Object.keys(filters).forEach(key => {
          url += `&${key}=${encodeURIComponent(filters[key])}`;
        });
      }
      
      return await this.apiClient.get(url);
    } catch (error) {
      throw new Error(`Failed to search companies: ${error instanceof Error ? error.message : String(error)}`);
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
 * Create a new LinkedIn integration
 */
export function createLinkedInIntegration(config: Partial<LinkedInConfig> = {}): LinkedInIntegration {
  const defaultConfig: LinkedInConfig = {
    id: 'linkedin',
    name: 'LinkedIn',
    type: (IntegrationType as any).SOCIAL || 'social',
    description: 'Integrate with LinkedIn for professional networking and business development',
    baseUrl: 'https://api.linkedin.com',
    defaultHeaders: {},
    authType: AuthType.OAUTH2,
    webhookSupport: true,
    apiVersion: 'v2',
    docUrl: 'https://docs.microsoft.com/en-us/linkedin/consumer/',
    logoUrl: 'https://content.linkedin.com/content/dam/me/business/en-us/amp/brand-site/v2/bg/LI-Bug.svg.original.svg'
  };
  
  return new LinkedInIntegration({
    ...defaultConfig,
    ...config
  });
}