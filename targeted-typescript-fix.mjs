#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const problematicFiles = [
  'packages/api-client/src/integrations/social/linkedin.ts',
  'packages/api-client/src/marketplace/MarketplaceService.ts',
  'packages/api-client/src/services/agent.service.ts',
  'packages/core/src/agents/agent-orchestrator.ts'
];

function fixLinkedInFile() {
  const filePath = 'packages/api-client/src/integrations/social/linkedin.ts';
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  const fixedContent = `// Import required API client and types
import { ApiClient } from '../../core/ApiClient.js';
import { Integration, IntegrationConfig } from '../types';

export interface LinkedInConfig extends IntegrationConfig {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  baseUrl?: string;
}

export class LinkedInIntegration implements Integration {
  public id: string;
  public name: string;
  public type: string;
  public capabilities: any;
  public isConnected: boolean = false;
  public isEnabled: boolean = true;
  public createdAt: Date = new Date();
  public updatedAt: Date = new Date();
  private apiClient: ApiClient;
  private config: LinkedInConfig;

  constructor(config: LinkedInConfig) {
    this.id = config.id || 'linkedin';
    this.name = config.name || 'LinkedIn';
    this.type = config.type || 'social';
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
    const apiConfig = {
      baseURL: config.baseUrl || 'https://api.linkedin.com',
      headers: {
        ...config.defaultHeaders,
        'Content-Type': 'application/json'
      }
    };
    
    // Add access token if provided
    if (config.accessToken) {
      apiConfig.headers = {
        ...apiConfig.headers,
        'Authorization': \`Bearer \${config.accessToken}\`
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
      throw new Error(\`Failed to connect to LinkedIn API: \${error instanceof Error ? error.message : String(error)}\`);
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
   * Execute an action on LinkedIn
   */
  async execute(action: string, params: any = {}): Promise<any> {
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
        throw new Error(\`Unsupported LinkedIn action: "\${action}"\`);
    }
  }

  /**
   * Create a post on LinkedIn
   */
  private async createPost(text: string, visibility = 'PUBLIC', media?: any[]): Promise<any> {
    try {
      const payload: any = {
        author: \`urn:li:person:\${this.getProfileId()}\`,
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
      throw new Error(\`Failed to create post: \${error instanceof Error ? error.message : String(error)}\`);
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
        owner: \`urn:li:person:\${this.getProfileId()}\`,
        subject: content.title || 'Shared Update',
        text: {
          text: content.text
        }
      };
      
      return await this.apiClient.post('/v2/shares', payload);
    } catch (error) {
      throw new Error(\`Failed to share update: \${error instanceof Error ? error.message : String(error)}\`);
    }
  }

  /**
   * Get profile information
   */
  private async getProfile(): Promise<any> {
    try {
      return await this.apiClient.get('/v2/me');
    } catch (error) {
      throw new Error(\`Failed to get profile: \${error instanceof Error ? error.message : String(error)}\`);
    }
  }

  /**
   * Get profile ID from current user
   */
  private getProfileId(): string {
    // This would normally be retrieved from the authentication response
    return 'current-user-id';
  }

  /**
   * Get connections
   */
  private async getConnections(start: number = 0, count: number = 100): Promise<any> {
    try {
      return await this.apiClient.get(\`/v2/people-search?start=\${start}&count=\${count}\`);
    } catch (error) {
      throw new Error(\`Failed to get connections: \${error instanceof Error ? error.message : String(error)}\`);
    }
  }

  /**
   * Send invitation
   */
  private async sendInvitation(recipient: string, message?: string): Promise<any> {
    try {
      const payload: any = {
        recipients: [\`urn:li:person:\${recipient}\`],
        'com.linkedin.voyager.growth.invitation.GenericInvitation': {}
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
      throw new Error(\`Failed to send invitation: \${error instanceof Error ? error.message : String(error)}\`);
    }
  }

  /**
   * Get company page information
   */
  private async getCompanyPage(companyId: string): Promise<any> {
    try {
      return await this.apiClient.get(\`/v2/organizations/\${companyId}\`);
    } catch (error) {
      throw new Error(\`Failed to get company page: \${error instanceof Error ? error.message : String(error)}\`);
    }
  }

  /**
   * Create a post on a company page
   */
  private async createCompanyPost(companyId: string, content: any): Promise<any> {
    try {
      const payload = {
        author: \`urn:li:organization:\${companyId}\`,
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
        (payload.specificContent['com.linkedin.ugc.ShareContent'] as any).media = content.media;
      }
      
      return await this.apiClient.post('/v2/ugcPosts', payload);
    } catch (error) {
      throw new Error(\`Failed to create company post: \${error instanceof Error ? error.message : String(error)}\`);
    }
  }

  /**
   * Get company analytics
   */
  private async getAnalytics(companyId: string, timeRange: string): Promise<any> {
    try {
      return await this.apiClient.get(\`/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:\${companyId}&timeIntervals.timeGranularityType=\${timeRange}&timeIntervals.timeRange=CUSTOM&timeIntervals.startTime=1577836800000\`);
    } catch (error) {
      throw new Error(\`Failed to get analytics: \${error instanceof Error ? error.message : String(error)}\`);
    }
  }

  /**
   * Search for people
   */
  private async searchPeople(keywords: string, filters?: any): Promise<any> {
    try {
      let url = \`/v2/people-search?keywords=\${encodeURIComponent(keywords)}\`;

      // Add any additional filters
      if (filters) {
        Object.keys(filters).forEach(key => { 
          url += \`&\${key}=\${encodeURIComponent(filters[key])}\`;
        });
      }

      return await this.apiClient.get(url);
    } catch (error) {
      throw new Error(\`Failed to search people: \${error instanceof Error ? error.message : String(error)}\`);
    }
  }

  /**
   * Search for companies
   */
  private async searchCompanies(keywords: string, filters?: any): Promise<any> {
    try {
      let url = \`/v2/company-search?keywords=\${encodeURIComponent(keywords)}\`;

      // Add any additional filters
      if (filters) {
        Object.keys(filters).forEach(key => { 
          url += \`&\${key}=\${encodeURIComponent(filters[key])}\`;
        });
      }

      return await this.apiClient.get(url);
    } catch (error) {
      throw new Error(\`Failed to search companies: \${error instanceof Error ? error.message : String(error)}\`);
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
    type: 'social' as any,
    description: 'Integrate with LinkedIn for professional networking and business development',
    baseUrl: 'https://api.linkedin.com',
    defaultHeaders: {},
    authType: 'OAUTH2' as any,
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
`;

  fs.writeFileSync(filePath, fixedContent, 'utf8');
  console.log(`✅ Fixed: ${filePath}`);
}

function fixMarketplaceServiceFile() {
  const filePath = 'packages/api-client/src/marketplace/MarketplaceService.ts';
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  const fixedContent = `import { EventEmitter } from "events";

/**
 * Marketplace events
 */
export enum MarketplaceEvent {
  INSTALLED = "integration:installed",
  UNINSTALLED = "integration:uninstalled",
  UPDATED = "integration:updated",
  DISCOVERED = "integration:discovered",
}

/**
 * Installation status of integrations
 */
export enum InstallationStatus {
  NOT_INSTALLED = "not_installed",
  INSTALLING = "installing",
  INSTALLED = "installed",
  UPDATE_AVAILABLE = "update_available",
  FAILED = "failed",
}

export interface IntegrationListing {
  id: string;
  name: string;
  description: string;
  type: string;
  logoUrl?: string;
  category?: string;
  author?: string;
  version: string;
  pricing?: {
    free: boolean;
    plans?: any[];
  };
  featured?: boolean;
  popularity?: number;
  rating?: number;
  installCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Integration {
  id: string;
  name: string;
  type: string;
  description?: string;
  config: any;
  capabilities: any;
  isConnected: boolean;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  execute(action: string, params?: any): Promise<any>;
  getMetadata(): Promise<Record<string, any>>;
}

/**
 * Integration Marketplace Service
 * Manages the discovery, installation, and updating of integrations
 */
export class MarketplaceService {
  private listings: Map<string, IntegrationListing> = new Map();
  private installationStatus: Map<
    string,
    { status: InstallationStatus; message?: string }
  > = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();
  private logger: any;

  constructor(
    private integrationRegistry: any,
    private loggingService: any,
    private discoveryEndpoint?: string,
  ) {
    this.logger = this.loggingService.createLogger("MarketplaceService");
    this.discoveryEndpoint =
      discoveryEndpoint ||
      "https://api.the-new-fuse.io/integrations/marketplace";
  }

  /**
   * Initialize the marketplace service
   */
  async initialize(): Promise<void> {
    try {
      await this.discoverIntegrations();
      this.updateInstallationStatuses();
      this.logger.info("Marketplace service initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize marketplace service", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  /**
   * Discover available integrations from marketplace
   */
  private async discoverIntegrations(): Promise<void> {
    try {
      this.logger.info("Discovering integrations from", this.discoveryEndpoint);
      
      // In a real implementation, this would fetch from the actual marketplace API
      const mockListings = await this.getMockListings();
      
      // Store the listings
      mockListings.forEach(listing => {
        this.listings.set(listing.id, listing);
      });
      
      this.logger.info(\`Discovered \${mockListings.length} integrations\`);
      
      // Emit discovery event for each integration
      mockListings.forEach(listing => {
        this.eventEmitter.emit(MarketplaceEvent.DISCOVERED, { integration: listing });
      });
    } catch (error) {
      this.logger.error("Failed to discover integrations", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Install an integration from the marketplace
   */
  async installIntegration(id: string): Promise<Integration> {
    const listing = this.listings.get(id);
    if (!listing) {
      throw new Error(\`Integration not found: \${id}\`);
    }

    // Set status to installing
    this.installationStatus.set(id, {
      status: InstallationStatus.INSTALLING,
      message: "Installing integration..."
    });

    this.eventEmitter.emit(MarketplaceEvent.INSTALLING, { integrationId: id });

    try {
      // Simulate installation process
      const integration = await this.simulateInstallation(listing);
      
      // Register with the integration registry
      this.integrationRegistry.register(integration);
      
      // Update status to installed
      this.installationStatus.set(id, {
        status: InstallationStatus.INSTALLED,
        message: "Integration installed successfully"
      });

      this.logger.info(\`Installed integration: \${listing.name}\`);
      this.eventEmitter.emit(MarketplaceEvent.INSTALLED, { integration });

      return integration;
    } catch (error) {
      // Update status to failed
      this.installationStatus.set(id, {
        status: InstallationStatus.FAILED,
        message: error instanceof Error ? error.message : String(error)
      });

      this.logger.error(\`Failed to install integration \${id}\`, error);
      throw error;
    }
  }

  /**
   * Uninstall an integration
   */
  async uninstallIntegration(id: string): Promise<void> {
    try {
      // Remove from registry
      this.integrationRegistry.unregister(id);
      
      // Update status
      this.installationStatus.set(id, {
        status: InstallationStatus.NOT_INSTALLED,
        message: "Integration uninstalled"
      });

      this.logger.info(\`Uninstalled integration: \${id}\`);
      this.eventEmitter.emit(MarketplaceEvent.UNINSTALLED, { integrationId: id });
    } catch (error) {
      this.logger.error(\`Failed to uninstall integration \${id}\`, error);
      throw error;
    }
  }

  /**
   * Get available integrations with optional filtering
   */
  getListings(filter?: {
    type?: string;
    category?: string;
    search?: string;
  }): IntegrationListing[] {
    let listings = Array.from(this.listings.values());

    if (filter) {
      if (filter.type) {
        listings = listings.filter(listing => listing.type === filter.type);
      }
      if (filter.category) {
        listings = listings.filter(listing => listing.category === filter.category);
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        listings = listings.filter(listing =>
          listing.name.toLowerCase().includes(searchLower) ||
          listing.description.toLowerCase().includes(searchLower)
        );
      }
    }

    return listings;
  }

  /**
   * Get a specific listing by ID
   */
  getListing(id: string): IntegrationListing | undefined {
    return this.listings.get(id);
  }

  /**
   * Get the installation status of an integration
   */
  getInstallationStatus(id: string): {
    status: InstallationStatus;
    message?: string;
  } {
    return (
      this.installationStatus.get(id) || {
        status: InstallationStatus.NOT_INSTALLED,
      }
    );
  }

  /**
   * Update installation statuses for all integrations
   */
  private updateInstallationStatuses(): void {
    // Update installation statuses based on the integration registry
    const registeredIntegrations = this.integrationRegistry.getIntegrations();

    // Set all listings to NOT_INSTALLED by default
    this.listings.forEach((listing, id) => {
      this.installationStatus.set(id, {
        status: InstallationStatus.NOT_INSTALLED,
      });
    });

    // Update status for installed integrations
    registeredIntegrations.forEach((integration: any) => {
      this.installationStatus.set(integration.id, {
        status: InstallationStatus.INSTALLED,
      });
    });
  }

  /**
   * Subscribe to marketplace events
   */
  on(event: MarketplaceEvent, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Unsubscribe from marketplace events
   */
  off(event: MarketplaceEvent, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Get mock listings for development/testing
   */
  private async getMockListings(): Promise<IntegrationListing[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: "openai",
        name: "OpenAI",
        description: "Integrate with OpenAI for GPT models and AI capabilities",
        type: "AI",
        logoUrl: "https://openai.com/content/images/2022/05/openai-avatar.png",
        category: "AI & Machine Learning",
        author: "The New Fuse",
        version: "1.0.0",
        pricing: {
          free: true
        },
        featured: true,
        popularity: 98,
        rating: 4.9,
        installCount: 12500,
        createdAt: new Date("2023-01-15"),
        updatedAt: new Date("2023-06-20")
      },
      {
        id: "anthropic",
        name: "Anthropic",
        description: "Integrate with Anthropic for Claude models and AI capabilities",
        type: "AI",
        logoUrl: "https://storage.googleapis.com/anthropic-public/assets/anthropic_black.png",
        category: "AI & Machine Learning",
        author: "The New Fuse",
        version: "1.0.0",
        pricing: {
          free: true
        },
        featured: true,
        popularity: 92,
        rating: 4.7,
        installCount: 8500,
        createdAt: new Date("2023-02-10"),
        updatedAt: new Date("2023-07-15")
      }
    ];
  }

  /**
   * Simulate installing an integration
   * In a real implementation, this would download and install the actual integration code
   */
  private async simulateInstallation(
    listing: IntegrationListing,
  ): Promise<Integration> {
    // Simulate installation delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // This is a simplified implementation. In a real system, you would:
    // 1. Download the integration package
    // 2. Install any dependencies
    // 3. Register the integration with the system
    // 4. Return the properly initialized integration
    
    // For now, we'll just create a placeholder integration
    return {
      id: listing.id,
      name: listing.name,
      type: listing.type,
      description: listing.description,
      config: {
        id: listing.id,
        name: listing.name,
        type: listing.type,
        description: listing.description,
        authType: listing.type === "AI" ? "api_key" : "oauth2",
      },
      capabilities: {
        actions: [],
        triggers: [],
        supportsWebhooks: listing.type === "AUTOMATION",
        supportsPolling: listing.type === "AUTOMATION",
      },
      isConnected: false,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      connect: async () => true,
      disconnect: async () => true,
      execute: async () => ({}),
      getMetadata: async () => ({
        id: listing.id,
        name: listing.name,
        type: listing.type,
      }),
    };
  }
}

// Minimal LoggingService for MarketplaceService
class LoggingService {
  info(...args: any[]) {
    console.info(...args);
  }
  warn(...args: any[]) {
    console.warn(...args);
  }
  error(...args: any[]) {
    console.error(...args);
  }
  debug(...args: any[]) {
    console.debug(...args);
  }
  createLogger(_name?: string) {
    return this;
  }
}
`;

  fs.writeFileSync(filePath, fixedContent, 'utf8');
  console.log(`✅ Fixed: ${filePath}`);
}

console.log('Starting targeted TypeScript fix...');

fixLinkedInFile();
fixMarketplaceServiceFile();

console.log('✅ Targeted fixes complete!');