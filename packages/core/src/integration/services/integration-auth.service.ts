import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from '../../services/LoggingService.js';
import { CredentialVault } from '../../security/CredentialVault.js';
import { AuthType } from '@the-new-fuse/api-client/src/integrations/types';

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
}

@Injectable()
export class IntegrationAuthService {
  private readonly logger: Logger;
  private oauthConfigs: Map<string, OAuthConfig> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService,
    private readonly credentialVault: CredentialVault
  ) {
    this.logger = this.loggingService.createLogger('IntegrationAuthService');
    this.loadOAuthConfigs();
  }

  /**
   * Load OAuth configuration from environment/config
   */
  private loadOAuthConfigs(): void {
    const oauthServices = this.configService.get<string[]>('integrations.oauth.services', []);
    
    for (const service of oauthServices) {
      const configPath = `integrations.oauth.${service}`;
      const clientId = this.configService.get<string>(`${configPath}.clientId`);
      const clientSecret = this.configService.get<string>(`${configPath}.clientSecret`);
      const redirectUri = this.configService.get<string>(`${configPath}.redirectUri`);
      const authorizeUrl = this.configService.get<string>(`${configPath}.authorizeUrl`);
      const tokenUrl = this.configService.get<string>(`${configPath}.tokenUrl`);
      const scope = this.configService.get<string>(`${configPath}.scope`);
      
      if (clientId && clientSecret && redirectUri && authorizeUrl && tokenUrl) {
        this.oauthConfigs.set(service, {
          clientId,
          clientSecret,
          redirectUri,
          authorizeUrl,
          tokenUrl,
          scope: scope || ''
        });
        this.logger.log(`Loaded OAuth configuration for ${service}`);
      } else {
        this.logger.warn(`Incomplete OAuth configuration for ${service}, skipping`);
      }
    }
  }

  /**
   * Get the authorization URL for OAuth-based integrations
   */
  getAuthorizationUrl(integrationId: string, state: string): string {
    const config = this.oauthConfigs.get(integrationId);
    if (!config) {
      throw new Error(`OAuth configuration not found for integration: ${integrationId}`);
    }
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      state,
      scope: config.scope
    });
    
    return `${config.authorizeUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    integrationId: string, 
    code: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    const config = this.oauthConfigs.get(integrationId);
    if (!config) {
      throw new Error(`OAuth configuration not found for integration: ${integrationId}`);
    }
    
    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.redirectUri,
          code
        }).toString()
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to exchange code for token: ${error}`);
      }
      
      const data = await response.json();
      
      // Store credentials securely
      await this.credentialVault.storeCredentials(integrationId, {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined
      });
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in
      };
    } catch (error) {
      this.logger.error(`Error exchanging code for token for integration ${integrationId}:`, error);
      throw new Error(`Failed to exchange authorization code: ${error.message}`);
    }
  }
  
  /**
   * Store API key for integration
   */
  async storeApiKey(integrationId: string, apiKey: string): Promise<void> {
    try {
      await this.credentialVault.storeCredentials(integrationId, { apiKey });
      this.logger.log(`Stored API key for integration ${integrationId}`);
    } catch (error) {
      this.logger.error(`Error storing API key for integration ${integrationId}:`, error);
      throw new Error(`Failed to store API key: ${error.message}`);
    }
  }
  
  /**
   * Store basic auth credentials
   */
  async storeBasicAuthCredentials(
    integrationId: string, 
    username: string, 
    password: string
  ): Promise<void> {
    try {
      await this.credentialVault.storeCredentials(integrationId, { username, password });
      this.logger.log(`Stored basic auth credentials for integration ${integrationId}`);
    } catch (error) {
      this.logger.error(`Error storing basic auth credentials for integration ${integrationId}:`, error);
      throw new Error(`Failed to store basic auth credentials: ${error.message}`);
    }
  }
  
  /**
   * Get stored credentials for an integration
   */
  async getCredentials(integrationId: string): Promise<Record<string, any>> {
    try {
      return await this.credentialVault.getCredentials(integrationId) || {};
    } catch (error) {
      this.logger.error(`Error retrieving credentials for integration ${integrationId}:`, error);
      throw new Error(`Failed to retrieve credentials: ${error.message}`);
    }
  }
  
  /**
   * Refresh OAuth token
   */
  async refreshOAuthToken(integrationId: string): Promise<{ accessToken: string; expiresIn?: number }> {
    const config = this.oauthConfigs.get(integrationId);
    if (!config) {
      throw new Error(`OAuth configuration not found for integration: ${integrationId}`);
    }
    
    // Get current credentials with refresh token
    const credentials = await this.credentialVault.getCredentials(integrationId);
    if (!credentials || !credentials.refreshToken) {
      throw new Error(`No refresh token found for integration: ${integrationId}`);
    }
    
    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: credentials.refreshToken
        }).toString()
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to refresh token: ${error}`);
      }
      
      const data = await response.json();
      
      // Update stored credentials
      await this.credentialVault.storeCredentials(integrationId, {
        ...credentials,
        accessToken: data.access_token,
        refreshToken: data.refresh_token || credentials.refreshToken, // Some providers don't return a new refresh token
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined
      });
      
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in
      };
    } catch (error) {
      this.logger.error(`Error refreshing token for integration ${integrationId}:`, error);
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }
  
  /**
   * Check if credentials are valid and not expired
   */
  async areCredentialsValid(integrationId: string, authType: AuthType): Promise<boolean> {
    const credentials = await this.credentialVault.getCredentials(integrationId);
    
    if (!credentials) {
      return false;
    }
    
    switch (authType) {
      case AuthType.API_KEY:
        return !!credentials.apiKey;
        
      case AuthType.BASIC:
        return !!credentials.username && !!credentials.password;
        
      case AuthType.OAUTH2:
        // Check if token is expired
        if (credentials.expiresAt) {
          const expiresAt = new Date(credentials.expiresAt);
          if (expiresAt.getTime() <= Date.now()) {
            // Token expired, try to refresh
            try {
              await this.refreshOAuthToken(integrationId);
              return true;
            } catch (error) {
              return false;
            }
          }
        }
        return !!credentials.accessToken;
        
      default:
        return true;
    }
  }
  
  /**
   * Delete stored credentials for an integration
   */
  async deleteCredentials(integrationId: string): Promise<boolean> {
    try {
      await this.credentialVault.deleteCredentials(integrationId);
      this.logger.log(`Deleted credentials for integration ${integrationId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting credentials for integration ${integrationId}:`, error);
      return false;
    }
  }
}